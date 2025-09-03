"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import AutoSuggestion from './auto-suggestion';

// Define the type for suggestion data
interface Suggestion {
  name: string;
  type: "customer" | "model" | "color";
}

interface OrderItem {
  id: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  product_model: string;
  color?: string;
  specification?: string;
  quantity: number | null;
  unit_price: number | null;
  is_shipped?: boolean;
}

interface OrderFormProps {
  initialData?: OrderItem[];
}

// Define suggestion data lists
const customerSuggestions: Suggestion[] = [
  { name: 'Sharif', type: 'customer' },
  { name: 'Uruma', type: 'customer' },
];
const productSuggestions: Suggestion[] = [
  { name: '9070', type: 'model' },
  { name: '9078', type: 'model' },
  { name: '9080', type: 'model' },
  { name: '9082', type: 'model' },
  { name: '9086', type: 'model' },
  { name: '9092', type: 'model' },
  { name: '9093', type: 'model' },
  { name: '9099', type: 'model' },
  { name: '9100', type: 'model' },
  { name: '9101', type: 'model' },
  { name: '9102', type: 'model' },
  { name: '9103', type: 'model' },
  { name: '9105', type: 'model' },
  { name: '9106', type: 'model' },
  { name: '9111', type: 'model' },
  { name: '9801', type: 'model' },
  { name: '9803', type: 'model' },
  { name: '9804', type: 'model' },
  { name: '9805', type: 'model' },
  { name: '9806', type: 'model' },
  { name: '9807', type: 'model' },
  { name: '9808', type: 'model' },
  { name: '9809', type: 'model' },
  { name: '9810', type: 'model' },
  { name: '9812', type: 'model' },
  { name: '9817', type: 'model' },
  { name: '9818', type: 'model' },
  { name: '9807', type: 'model' },
  { name: '9819', type: 'model' },
  { name: '9820', type: 'model' },
  { name: 'D-02', type: 'model' },
  { name: 'X-21', type: 'model' },
  { name: '2186', type: 'model' },
  { name: '2188', type: 'model' },
  { name: '2291', type: 'model' },
  { name: '2397', type: 'model' },
  { name: '2556', type: 'model' },
  { name: '2573', type: 'model' },
  { name: '2576', type: 'model' },
  { name: '9001', type: 'model' },
  { name: '9003', type: 'model' },
  { name: '9004', type: 'model' },
  { name: '9006', type: 'model' },
  { name: '9007', type: 'model' },
  { name: '9008', type: 'model' },
  { name: '9009', type: 'model' },
];
const colorSuggestions: Suggestion[] = [
  { name: '363-6', type: 'color' },
  { name: '363-11', type: 'color' },
  { name: 'M9011-2', type: 'color' },
  { name: 'HJ001', type: 'color' },
];

export function OrderForm({ initialData }: OrderFormProps) {
  const [orderHeader, setOrderHeader] = useState({
    order_number: '',
    order_date: new Date().toISOString().split('T')[0],
    customer_name: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>(
    initialData ? initialData.map(item => ({ ...item, id: item.id || uuidv4() })) : [
      {
        id: uuidv4(),
        order_number: '',
        order_date: '',
        customer_name: '',
        product_model: '',
        color: '',
        specification: '',
        quantity: 0,
        unit_price: 0,
      }
    ]
  );

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [isConfirmationRequired, setIsConfirmationRequired] = useState(false);

  const [totalQuantity, setTotalQuantity] = useState(0);
  const [grandTotalPrice, setGrandTotalPrice] = useState(0);
  const [actualPrice, setActualPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  const router = useRouter();

  // Update grand total price and total quantity whenever order items change
  useEffect(() => {
    const totalQ = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalP = orderItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
    setTotalQuantity(totalQ);
    setGrandTotalPrice(totalP);
  }, [orderItems]);

  // Sync actualPrice with grandTotalPrice and calculate discount
  useEffect(() => {
    setActualPrice(grandTotalPrice);
  }, [grandTotalPrice]);

  useEffect(() => {
    const calculatedDiscount = (grandTotalPrice ?? 0) - (actualPrice ?? 0);
    setDiscount(calculatedDiscount >= 0 ? calculatedDiscount : 0);
  }, [actualPrice, grandTotalPrice]);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      // If we have initial data, populate the form with it.
      // Assuming all items in initialData belong to the same order.
      const firstItem = initialData[0];
      setOrderHeader({
        order_number: firstItem.order_number.length > 8 ? firstItem.order_number.slice(8) : '',
        order_date: firstItem.order_date,
        customer_name: firstItem.customer_name,
      });
      setOrderItems(initialData);
    }
  }, [initialData]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrderHeader(prev => ({ ...prev, [name]: value }));
    setIsConfirmationRequired(false);
    setError(null);
  };

  const handleItemChange = (id: string, name: string, value: string | number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        let updatedItem = { ...item };
  
        // 修复后的代码：使用 if/else if 链，针对每个属性分别赋值
        if (name === 'quantity') {
          updatedItem.quantity = Number(value);
        } else if (name === 'unit_price') {
          updatedItem.unit_price = Number(value);
        } else if (name === 'product_model') {
          updatedItem.product_model = String(value);
        } else if (name === 'color') {
          updatedItem.color = String(value);
        } else if (name === 'specification') {
          updatedItem.specification = String(value);
        }
  
        // 防止负数数量
        if (updatedItem.quantity && updatedItem.quantity < 0) {
          updatedItem.quantity = 0;
        }
  
        return updatedItem;
      }
      return item;
    }));
    setIsConfirmationRequired(false);
    setError(null);
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, {
      id: uuidv4(),
      order_number: '',
      order_date: '',
      customer_name: '',
      product_model: '',
      color: '',
      specification: '',
      quantity: 0,
      unit_price: 0,
    }]);
    setIsConfirmationRequired(false);
    setError(null);
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
    setIsConfirmationRequired(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isConfirmationRequired) {
      // Final submission logic
      setIsConfirmationRequired(false);
      setError(null);
      await performSubmission();
    } else {
      // Initial validation and check for new values
      const newValues: string[] = [];
      if (orderHeader.customer_name && !customerSuggestions.some(s => s.name === orderHeader.customer_name)) {
        newValues.push(`客户名称: '${orderHeader.customer_name}'`);
      }

      orderItems.forEach((item, index) => {
        if (item.product_model && !productSuggestions.some(s => s.name === item.product_model)) {
          newValues.push(`第 ${index + 1} 项产品型号: '${item.product_model}'`);
        }
        if (item.color && !colorSuggestions.some(s => s.name === item.color)) {
          newValues.push(`第 ${index + 1} 项颜色: '${item.color}'`);
        }
      });

      if (newValues.length > 0) {
        setError(`以下值不在建议列表中: ${newValues.join('; ')}。请再次点击提交按钮确认。`);
        setIsConfirmationRequired(true);
        setIsLoading(false);
      } else {
        await performSubmission();
      }
    }
  };

  const performSubmission = async () => {
    const orderDateValue = orderHeader.order_date;
    const orderNumberSuffix = orderHeader.order_number;

    if (!orderDateValue || !orderNumberSuffix) {
      setError("请确保已填写订单日期和订单序数。");
      setIsLoading(false);
      return;
    }

    const datePrefix = orderDateValue.replace(/-/g, '');
    const fullOrderNumber = `${datePrefix}${orderNumberSuffix}`;

    // 关键调试：打印出即将发送的订单号，以验证是否正确
    console.log('正在提交的订单号:', fullOrderNumber);
    let formError = null;

    try {
      if (initialData) {
        // --- Edit mode: Update headers and line items separately ---
        const { error: headerError } = await supabase.from('orders').upsert({
          order_number: fullOrderNumber,
          order_date: orderDateValue,
          customer_name: orderHeader.customer_name,
          final_price: actualPrice,
        }, { onConflict: 'order_number' });
        if (headerError) throw headerError;

        const oldIds = initialData.map(item => item.id);
        const currentIds = orderItems.map(item => item.id);
        const idsToDelete = oldIds.filter(id => !currentIds.includes(id));

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase.from('items').delete().in('id', idsToDelete);
          if (deleteError) throw deleteError;
        }

        const itemsToUpsert = orderItems.map(item => ({
          ...item,
          order_number: fullOrderNumber,
          is_shipped: item.is_shipped || false,
          //确保在 upsert 时 total_price 是计算过的
          total_price: (item.quantity ?? 0) * (item.unit_price ?? 0),
        }));

        const { error: upsertError } = await supabase.from('items').upsert(itemsToUpsert, { onConflict: 'id' });
        if (upsertError) throw upsertError;

      } else {
        // --- New order mode: Insert header first, then items ---
        const { error: orderError } = await supabase.from('orders').insert({
          order_number: fullOrderNumber,
          order_date: orderDateValue,
          customer_name: orderHeader.customer_name,
          final_price: actualPrice,
        });
        if (orderError) throw orderError;

        const itemsToInsert = orderItems.map(item => ({
          order_number: fullOrderNumber,
          product_model: item.product_model,
          color: item.color,
          specification: item.specification,
          quantity: item.quantity,
          unit_price: item.unit_price,
          is_shipped: false,
        }));

        const { error: itemsError } = await supabase.from('items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error("Submission error:", err.message);
      setError(err instanceof Error ? err.message : "提交时发生未知错误。请检查控制台以获取更多信息。");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-7xl mx-auto rounded-xl shadow-lg border-gray-200 dark:border-gray-800 transition-all duration-300">
      <CardHeader className="p-6 md:p-8 border-b dark:border-gray-800">
        <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 transition-colors duration-300">
          {initialData ? '编辑订单' : '新增订单'}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          填写订单公共信息及产品明细。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        {error && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-200 transition-all duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold">警告</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="grid gap-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="order_number">订单序数</Label>
              <Input
                name="order_number"
                value={orderHeader.order_number}
                onChange={handleHeaderChange}
                required
                className="rounded-lg transition-colors duration-300"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order_date">日期</Label>
              <Input
                name="order_date"
                type="date"
                value={orderHeader.order_date}
                onChange={handleHeaderChange}
                required
                className="rounded-lg transition-colors duration-300"
              />
            </div>
            <AutoSuggestion
              label="客户名称"
              value={orderHeader.customer_name}
              suggestions={customerSuggestions}
              onChange={(val) => setOrderHeader(prev => ({ ...prev, customer_name: val }))}
              onSelect={(val) => setOrderHeader(prev => ({ ...prev, customer_name: val }))}
              isInvalid={false}
              type="customer"
            />
          </div>

          <div className="p-6 border rounded-xl bg-gray-50 dark:bg-gray-900 transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">产品明细</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  添加并管理此订单中的所有产品项目。
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleAddItem}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> 添加新产品
              </Button>
            </div>
            <div className="grid gap-6">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_0.5fr_1fr_0.75fr_0.25fr] gap-4 items-end py-4 border-b last:border-b-0 dark:border-gray-800 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg -mx-2 px-2"
                >
                  <AutoSuggestion
                    label="型号"
                    value={item.product_model}
                    suggestions={productSuggestions}
                    onChange={(val) => handleItemChange(item.id, 'product_model', val)}
                    onSelect={(val) => handleItemChange(item.id, 'product_model', val)}
                    isInvalid={false}
                    type="model"
                  />
                  <AutoSuggestion
                    label="颜色"
                    value={item.color || ''}
                    suggestions={colorSuggestions}
                    onChange={(val) => handleItemChange(item.id, 'color', val)}
                    onSelect={(val) => handleItemChange(item.id, 'color', val)}
                    isInvalid={false}
                    type="color"
                  />
                  <div className="grid gap-2">
                    <Label>规格</Label>
                    <Input
                      name="specification"
                      value={item.specification}
                      onChange={(e) => handleItemChange(item.id, e.target.name, e.target.value)}
                      className="rounded-lg transition-colors duration-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>数量</Label>
                    <Input
                      name="quantity"
                      type="number"
                      min="0"
                      value={item.quantity ?? 0}
                      onChange={(e) => handleItemChange(item.id, e.target.name, Number(e.target.value))}
                      required
                      className="rounded-lg transition-colors duration-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>单价</Label>
                    <Input
                      name="unit_price"
                      type="text"
                      value={editingPriceId === item.id ? (item.unit_price ?? 0) : (item.unit_price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      onChange={(e) => handleItemChange(item.id, e.target.name, Number(e.target.value.replace(/[^0-9.]/g, '')))}
                      onFocus={() => setEditingPriceId(item.id)}
                      onBlur={() => setEditingPriceId(null)}
                      required
                      className="rounded-lg transition-colors duration-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>小计</Label>
                    <Input
                      value={((item.quantity ?? 0) * (item.unit_price ?? 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      readOnly
                      className="font-semibold text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 rounded-lg transition-colors duration-300"
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    {orderItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-all duration-300">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">订单汇总</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
              <div className="flex flex-col">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">总数量 (套)</Label>
                <div className="font-semibold text-lg text-gray-900 dark:text-gray-50 transition-all duration-300">
                  {(totalQuantity ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">总价</Label>
                <div className="font-semibold text-lg text-gray-900 dark:text-gray-50 transition-all duration-300">
                  {(grandTotalPrice ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">成交价格</Label>
                <Input
                  type="text"
                  value={(actualPrice ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  onChange={(e) => setActualPrice(Number(e.target.value.replace(/[^0-9.]/g, '')))}
                  className="font-bold text-lg text-gray-900rounded-lg transition-colors duration-300"
                />
              </div>
              <div className="flex flex-col">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">优惠金额</Label>
                <div
                  className="font-bold text-lg text-gray-900 dark:text-gray-50 border-none bg-transparent"
                >
                  {(discount ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 text-md font-semibold rounded-lg shadow-md transition-all duration-300 hover:scale-[1.005] active:scale-[0.99] bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900"
          >
            {isLoading ? (initialData ? '更新中...' : '提交中...') : isConfirmationRequired ? '确认提交' : (initialData ? '更新订单' : '新增订单')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
