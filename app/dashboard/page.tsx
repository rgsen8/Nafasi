"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, FilePlus, Pencil, DollarSign, Truck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

// Define the type for the order item, aligned with types/interfaces.ts
interface OrderItem {
  id: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  product_model: string;
  color?: string;
  specification?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_shipped?: boolean;
}

// Interfaces for database-fetched data
interface DbOrder {
  order_number: string;
  order_date: string;
  customer_name: string;
  final_price?: number;
}

interface DbItem {
  id: string;
  order_number: string;
  product_model: string;
  color?: string;
  specification?: string;
  quantity?: number;
  unit_price?: number;
  is_shipped?: boolean;
}

interface DbPayment {
  order_number: string;
  amount?: number;
}

// Define the type for the grouped order
interface GroupedOrder {
  order_number: string;
  order_date: string;
  customer_name: string;
  order_count_for_customer?: number;
  total_order_quantity: number;
  is_shipped: boolean;
  is_settled?: boolean;
  items: OrderItem[];
  final_price: number;
  paid_price: number;
  receivable_price: number;
  is_completed: boolean;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<GroupedOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 将从多个 Supabase 表中获取的数据进行分组和整合。
   *
   * @param {DbOrder[]} ordersData - 来自 `orders` 表的数据
   * @param {DbItem[]} itemsData - 来自 `items` 表的数据
   * @param {DbPayment[]} paymentsData - 来自 `payments` 表的数据
   * @returns {GroupedOrder[]} 整合后的分组订单列表
   */
  const groupDataAndCalculate = (ordersData: DbOrder[], itemsData: DbItem[], paymentsData: DbPayment[]): GroupedOrder[] => {
    // 按日期对原始订单数据进行排序，以确保正确的下单次数
    const sortedOrdersData = [...ordersData].sort((a, b) => {
      return new Date(a.order_date).getTime() - new Date(b.order_date).getTime();
    });

    const groupedMap = new Map<string, GroupedOrder>();
    const customerOrderCounts = new Map<string, number>();

    // Step 1: 初始化分组订单并计算客户的下单次数，同时读取最终价格
    sortedOrdersData.forEach(order => {
      const currentCount = customerOrderCounts.get(order.customer_name) || 0;
      const newCount = currentCount + 1;
      customerOrderCounts.set(order.customer_name, newCount);

      groupedMap.set(order.order_number, {
        order_number: order.order_number,
        order_date: order.order_date,
        customer_name: order.customer_name,
        order_count_for_customer: newCount,
        is_shipped: false,
        is_settled: false,
        items: [],
        total_order_quantity: 0,
        final_price: Number(order.final_price) ?? 0,
        paid_price: 0,
        receivable_price: 0,
        is_completed: false,
      });
    });

    // Step 2: 添加明细项数据到对应的订单中，并计算每个明细项的合计
    itemsData.forEach(item => {
      const orderGroup = groupedMap.get(item.order_number);
      if (orderGroup) {
        const itemTotalPrice = (Number(item.quantity) ?? 0) * (Number(item.unit_price) ?? 0);
        orderGroup.items.push({
          ...item, quantity: item.quantity ?? 0, unit_price: item.unit_price ?? 0, total_price: itemTotalPrice,
          order_date: '',
          customer_name: ''
        });
        orderGroup.total_order_quantity += Number(item.quantity) ?? 0;
      }
    });

    // Step 3: 添加支付数据到对应的订单中
    paymentsData.forEach(payment => {
      const orderGroup = groupedMap.get(payment.order_number);
      if (orderGroup) {
        orderGroup.paid_price += Number(payment.amount) ?? 0;
      }
    });

    // Step 4: 最终计算应收款和订单完成状态
    return Array.from(groupedMap.values()).map(orderGroup => {
      const allItemsShipped = orderGroup.items.every(item => item.is_shipped);
      const receivablePrice = orderGroup.final_price - orderGroup.paid_price;
      const isCompleted = receivablePrice <= 0 && allItemsShipped;

      return {
        ...orderGroup,
        receivable_price: receivablePrice,
        is_shipped: allItemsShipped,
        is_settled: receivablePrice <= 0,
        is_completed: isCompleted,
      };
    }).sort((a, b) => {
      return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
    });
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      // Step 1: Fetch data from the main 'orders' table.
      let ordersQuery = supabase.from('orders').select('*');
      if (searchTerm) {
        ordersQuery = ordersQuery.ilike('customer_name', `%${searchTerm}%`);
      }
      const { data: ordersData, error: ordersError } = await ordersQuery;

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        setError('无法加载订单数据。');
        setLoading(false);
        return;
      }

      // Step 2: Fetch data from the 'items' table.
      const { data: itemsData, error: itemsError } = await supabase.from('items').select('*');
      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        setError('无法加载订单明细数据。');
        setLoading(false);
        return;
      }

      // Step 3: Fetch data from the 'payments' table.
      const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*');
      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        setError('无法加载支付数据。');
        setLoading(false);
        return;
      }

      // Step 4: Group and process the data.
      const groupedData = groupDataAndCalculate(ordersData as DbOrder[], itemsData as DbItem[], paymentsData as DbPayment[]);
      setOrders(groupedData);
      setLoading(false);
    };

    fetchOrders();
  }, [searchTerm]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">订单管理系统</h1>
        <Button asChild>
          <Link href="/dashboard/new">
            <FilePlus className="mr-2 h-4 w-4" /> 新增订单
          </Link>
        </Button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="按客户名称搜索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading && <p className="text-center">正在加载数据...</p>}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="text-center text-gray-500">没有找到任何订单。</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((orderGroup) => (
            <Card
              key={orderGroup.order_number}
              className={`relative overflow-hidden border ${orderGroup.is_completed ? 'border-green-500' : 'border-gray-200'}`}
            >
              <CardHeader className="flex flex-col p-4 z-10">
                <div className="flex justify-between items-center space-x-2">
                  <h3 className="text-lg font-bold">订单号: {orderGroup.order_number}</h3>
                  <div className="flex-none flex items-center ml-4 space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log(`Simulating Edit: ${orderGroup.order_number}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log(`Simulating Payment: ${orderGroup.order_number}`)}
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log(`Simulating Delivery: ${orderGroup.order_number}`)}
                    >
                      <Truck className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-6 mt-1">
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <h2 className="font-bold">{orderGroup.customer_name}</h2>
                    <span className="text-gray-500">(第{orderGroup.order_count_for_customer ?? '1'}次下单)</span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm font-medium text-gray-700">
                    <span>订单日期: {new Date(orderGroup.order_date).toLocaleDateString()}</span>
                    <span>{orderGroup.total_order_quantity ?? 0}套</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 z-10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品型号</TableHead>
                      <TableHead>颜色</TableHead>
                      <TableHead>规格</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">单价</TableHead>
                      <TableHead className="text-right">合计</TableHead>
                      <TableHead className="text-center">发货状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderGroup.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_model}</TableCell>
                        <TableCell>{item.color || '-'}</TableCell>
                        <TableCell>{item.specification || '-'}</TableCell>
                        <TableCell className="text-right">{item.quantity ?? 0}</TableCell>
                        <TableCell className="text-right">
                          {(item.unit_price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} Shs
                        </TableCell>
                        <TableCell className="text-right">
                          {(item.total_price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} Shs
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${item.is_shipped ? 'bg-white text-gray-800 border-gray-200 border' : 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800'}`}>
                            {item.is_shipped ? '已发货' : '未发货'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-end p-4 z-10">
                <div className="text-right space-y-1">
                  <div className="font-bold pr-2">
                    <span className="text-sm text-gray-500">成交价格：</span>
                    <span className="ml-2 text-xl text-gray-900 dark:text-gray-100">
                      {(orderGroup.final_price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} Shs
                    </span>
                  </div>
                  {orderGroup.is_completed ? (
                    <div className="font-bold text-lg text-green-600 pr-2">
                      订单已完成
                    </div>
                  ) : (orderGroup.receivable_price ?? 0) <= 0 ? (
                    <div className="text-sm text-gray-500 pr-2">已结清</div>
                  ) : (
                    <div className="pr-2">
                      <span className="text-sm text-gray-500">应收款：</span>
                      <span className="ml-2 text-base font-bold text-gray-500">
                        {(orderGroup.receivable_price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} Shs
                      </span>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
