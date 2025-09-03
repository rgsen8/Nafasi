export interface OrderItem {
    id: string; // Used for React list keys and form management (client-side unique identifier)
    order_id?: string; // The database ID from Supabase
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