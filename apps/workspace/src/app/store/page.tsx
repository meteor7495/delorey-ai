import { redirect } from 'next/navigation';

/** External Shopify/Woo store page removed — native shop only. */
export default function StoreRedirectPage() {
  redirect('/shop');
}
