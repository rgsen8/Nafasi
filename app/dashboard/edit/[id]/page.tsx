"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { OrderForm } from '@/components/order-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

// Define the type for order items, matching the order-form component
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

// Define props for the Next.js page component
interface EditOrderPageProps {
  params: {
    id: string; // The order number from the URL
  };
}

export default function EditOrderPage({ params }: EditOrderPageProps) {
  const [initialData, setInitialData] = useState<OrderItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the ID from the URL to fetch data
  const orderNumber = params.id;

  useEffect(() => {
    async function fetchOrderData() {
      if (!orderNumber) {
        setError('未找到订单号。');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all order items associated with the given order number
        const { data, error } = await supabase
          .from('items')
          .select(`
            id,
            order_number,
            product_model,
            color,
            specification,
            quantity,
            unit_price,
            is_shipped,
            orders (
              order_date,
              customer_name
            )
          `)
          .eq('order_number', orderNumber);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Flatten the data to match the OrderItem interface
          const transformedData: OrderItem[] = data.map((item: any) => ({
            id: item.id,
            order_number: item.order_number,
            order_date: item.orders.order_date,
            customer_name: item.orders.customer_name,
            product_model: item.product_model,
            color: item.color,
            specification: item.specification,
            quantity: item.quantity,
            unit_price: item.unit_price,
            is_shipped: item.is_shipped,
          }));
          setInitialData(transformedData);
        } else {
          setError('未找到此订单的数据。');
        }
      } catch (err: unknown) {
        let errorMessage = '加载订单数据失败，请重试。';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        console.error('获取订单数据时发生错误:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderData();
  }, [orderNumber]);

  return (
    <div className="container mx-auto py-10">
      {isLoading ? (
        <Card className="w-full max-w-lg mx-auto rounded-xl shadow-lg border-gray-200 dark:border-gray-800 transition-all duration-300">
          <CardHeader className="p-6 md:p-8">
            <CardTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              加载中...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-6 md:p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive" className="w-full max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <OrderForm initialData={initialData || []} />
      )}
    </div>
  );
}
