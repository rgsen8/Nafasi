"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AlertCircle, PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define the type for an item in the form state
interface FormItem {
  id?: string;
  product_model: string;
  color: string;
  specification: string;
  quantity: number;
  unit_price: number;
  is_shipped: boolean;
}

// Define the type for the complete form data
interface FormData {
  order_number: string;
  order_date: string;
  customer_name: string;
  final_price: number;
  paid_price: number;
  items: FormItem[];
}

export default function EditOrderPage() {
  const { orderNumber } = useParams();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      // Log the orderNumber to ensure it's being received correctly
      console.log('Fetching order for orderNumber:', orderNumber);

      if (!orderNumber) {
        setLoading(false);
        setError('URL中缺少订单号，无法加载。');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch order details from the 'orders' table
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .single();

        if (orderError) throw new Error(orderError.message);
        if (!orderData) throw new Error('Order not found.');

        // Fetch items for the order from the 'items' table
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('order_number', orderNumber);

        if (itemsError) throw new Error(itemsError.message);

        // Fetch payments for the order from the 'payments' table
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('order_number', orderNumber);

        if (paymentsError) throw new Error(paymentsError.message);

        // Calculate total paid price
        const totalPaidPrice = paymentsData.reduce((sum, payment) => sum + Number(payment.paid_price), 0);

        // Combine all fetched data into the form state
        setFormData({
          order_number: orderData.order_number,
          order_date: orderData.order_date,
          customer_name: orderData.customer_name,
          final_price: Number(orderData.final_price) ?? 0,
          paid_price: totalPaidPrice,
          items: itemsData.map(item => ({
            id: item.id,
            product_model: item.product_model,
            color: item.color,
            specification: item.specification,
            quantity: Number(item.quantity) ?? 0,
            unit_price: Number(item.unit_price) ?? 0,
            is_shipped: item.is_shipped,
          })) as FormItem[],
        });
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(`无法加载订单信息: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderNumber]);

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    if (!formData) return;
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    if (!formData) return;
    const newItem: FormItem = {
      product_model: '',
      color: '',
      specification: '',
      quantity: 0,
      unit_price: 0,
      is_shipped: false,
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!formData) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setLoading(true);
    setError(null);
    try {
      // Logic for saving the changes to the database would go here.
      // For this example, we'll just log the data.
      console.log('Attempting to save the following data:', formData);
      // In a real application, you would perform update, insert, and delete
      // operations on the 'items' and 'payments' tables based on the changes.
      // After successful save, you would navigate back or show a success message.
      console.log('数据更新成功（功能待完善）！请查看控制台日志。');
    } catch (err: any) {
      setError(`保存失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">正在加载订单信息...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto w-full max-w-2xl mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>错误</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!formData) {
    return <div className="text-center py-8">未找到订单。</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回
        </Button>
        <h1 className="text-3xl font-bold">编辑订单: {orderNumber}</h1>
      </div>

      <Card className="max-w-4xl mx-auto p-6 shadow-lg">
        <CardHeader>
          <CardTitle>订单详情</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer_name">客户名称</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  readOnly
                  className="bg-gray-100 text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_date">订单日期</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={formData.order_date.split('T')[0]}
                  readOnly
                  className="bg-gray-100 text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <h3 className="text-xl font-semibold">订单明细</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品型号</TableHead>
                    <TableHead>颜色</TableHead>
                    <TableHead>规格</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">单价</TableHead>
                    <TableHead className="text-right">合计</TableHead>
                    <TableHead>发货状态</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        <Input
                          value={item.product_model}
                          onChange={(e) => handleItemChange(index, 'product_model', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.color}
                          onChange={(e) => handleItemChange(index, 'color', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.specification}
                          onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(item.quantity * item.unit_price).toLocaleString('en-US', { maximumFractionDigits: 0 })} Shs
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={item.is_shipped}
                          onChange={(e) => handleItemChange(index, 'is_shipped', e.target.checked)}
                          className="form-checkbox h-5 w-5 text-green-600 rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button type="button" variant="outline" className="w-full" onClick={handleAddItem}>
                <PlusCircle className="mr-2 h-4 w-4" /> 添加明细
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="space-y-2">
                <Label>最终价格 (从数据库读取)</Label>
                <Input
                  value={formData.final_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  readOnly
                  className="bg-gray-100 text-gray-700 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label>已付金额 (从数据库读取)</Label>
                <Input
                  value={formData.paid_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  readOnly
                  className="bg-gray-100 text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label>应收款项</Label>
                <Input
                  value={(formData.final_price - formData.paid_price).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  readOnly
                  className="bg-gray-100 text-gray-700"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">更新订单</Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-sm text-gray-500">
          <p>请注意：此页面目前仅用于显示和编辑数据，更新操作还未完全实现。</p>
        </CardFooter>
      </Card>
    </div>
  );
}
