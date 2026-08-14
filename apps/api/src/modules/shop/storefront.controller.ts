import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ShopService } from './shop.service';

class CartItemDto {
  @IsString()
  sessionId!: string;

  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNumber()
  @Min(0)
  quantity!: number;
}

class CheckoutDto {
  @IsString()
  sessionId!: string;

  @IsString()
  @MinLength(2)
  customerName!: string;

  @IsString()
  @MinLength(8)
  customerPhone!: string;

  @IsString()
  @MinLength(5)
  customerAddress!: string;

  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsIn(['cod', 'online'])
  paymentMethod?: 'cod' | 'online';
}

class CustomerRegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsString()
  @MinLength(5)
  address!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

class DiscountValidateDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;
}

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly shop: ShopService) {}

  @Get(':storeSlug/home')
  home(@Param('storeSlug') storeSlug: string) {
    return this.shop.publicHome(storeSlug);
  }

  @Get(':storeSlug/categories')
  categories(@Param('storeSlug') storeSlug: string) {
    return this.shop.publicCategories(storeSlug);
  }

  @Get(':storeSlug/products')
  products(
    @Param('storeSlug') storeSlug: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('inStock') inStock?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.shop.publicProducts(storeSlug, {
      q,
      category,
      inStock,
      minPrice,
      maxPrice,
    });
  }

  @Get(':storeSlug/products/:productSlug')
  product(
    @Param('storeSlug') storeSlug: string,
    @Param('productSlug') productSlug: string,
  ) {
    return this.shop.publicProduct(storeSlug, productSlug);
  }

  @Get(':storeSlug/cart')
  cart(
    @Param('storeSlug') storeSlug: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.shop.getCart(storeSlug, sessionId);
  }

  @Post(':storeSlug/cart')
  setCart(@Param('storeSlug') storeSlug: string, @Body() dto: CartItemDto) {
    return this.shop.setCartItem(storeSlug, {
      sessionId: dto.sessionId,
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity,
    });
  }

  @Post(':storeSlug/discounts/validate')
  validateDiscount(
    @Param('storeSlug') storeSlug: string,
    @Body() dto: DiscountValidateDto,
  ) {
    return this.shop.publicValidateDiscount(
      storeSlug,
      dto.code,
      dto.subtotal ?? 0,
    );
  }

  @Post(':storeSlug/checkout')
  checkout(@Param('storeSlug') storeSlug: string, @Body() dto: CheckoutDto) {
    return this.shop.checkout(storeSlug, dto);
  }

  @Get(':storeSlug/customer')
  customer(
    @Param('storeSlug') storeSlug: string,
    @Query('phone') phone: string,
  ) {
    return this.shop.lookupCustomer(storeSlug, phone ?? '');
  }

  @Post(':storeSlug/customer')
  register(
    @Param('storeSlug') storeSlug: string,
    @Body() dto: CustomerRegisterDto,
  ) {
    return this.shop.registerCustomer(storeSlug, dto);
  }

  @Get(':storeSlug/orders/track')
  track(
    @Param('storeSlug') storeSlug: string,
    @Query('orderNumber') orderNumber: string,
    @Query('phone') phone: string,
  ) {
    return this.shop.trackOrder(storeSlug, orderNumber, phone);
  }
}
