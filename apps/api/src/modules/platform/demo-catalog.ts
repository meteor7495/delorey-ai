import type { PrismaClient } from '@prisma/client';

function mediaBase() {
  return (
    process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001'
  ).replace(/\/$/, '');
}

export function sampleUrl(file: string) {
  return `${mediaBase()}/static/samples/${file}`;
}

export async function seedNativeShop(prisma: PrismaClient, tenantId: string) {
  const img = sampleUrl;

  const categoryRows = [
    {
      slug: 'poshak',
      name: 'پوشاک',
      sortOrder: 1,
      imageUrl: img('shirt.jpg'),
      description: 'پیراهن، شلوار، کت و کالکشن فصل',
    },
    {
      slug: 'kif-kafsh',
      name: 'کیف و کفش',
      sortOrder: 2,
      imageUrl: img('shoes.jpg'),
      description: 'کیف چرمی و کفش روزمره',
    },
    {
      slug: 'khane',
      name: 'خانه و دکوراسیون',
      sortOrder: 3,
      imageUrl: img('vase.jpg'),
      description: 'لوازم خانه، روشنایی و دکور',
    },
    {
      slug: 'electronic',
      name: 'الکترونیک',
      sortOrder: 4,
      imageUrl: img('headphones.jpg'),
      description: 'هدفون، ساعت و گجت',
    },
    {
      slug: 'zibayi',
      name: 'زیبایی',
      sortOrder: 5,
      imageUrl: img('perfume.jpg'),
      description: 'عطر و مراقبت شخصی',
    },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoryRows) {
    const row = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId, slug: c.slug } },
      create: { tenantId, ...c, active: true },
      update: {
        name: c.name,
        imageUrl: c.imageUrl,
        description: c.description,
        sortOrder: c.sortOrder,
        active: true,
      },
    });
    categories[c.slug] = row.id;
  }

  const products = [
    {
      sku: 'SHIRT-001',
      slug: 'linen-blue-shirt',
      title: 'پیراهن لینن آبی',
      price: 890_000,
      compareAtPrice: 1_190_000,
      inStock: true,
      categoryId: categories.poshak,
      brand: 'Seloma',
      shortDescription: 'لینن خنک برای بهار و تابستان',
      description:
        'پیراهن لینن آبی روشن با برش آزاد. مناسب هوای گرم. سایزهای M و L موجود است.',
      tags: ['لینن', 'پیراهن', 'بهاره'],
      images: [img('shirt.jpg')],
    },
    {
      sku: 'BAG-014',
      slug: 'black-leather-bag',
      title: 'کیف چرمی مشکی',
      price: 2_450_000,
      compareAtPrice: 2_890_000,
      inStock: true,
      categoryId: categories['kif-kafsh'],
      brand: 'Seloma',
      shortDescription: 'کیف روزانه با بند قابل تنظیم',
      description: 'کیف چرم مصنوعی مشکی با فضای لپ‌تاپ و جیب داخلی.',
      tags: ['کیف', 'چرم'],
      images: [img('bag.jpg')],
    },
    {
      sku: 'SHOE-220',
      slug: 'white-sport-shoes',
      title: 'کفش اسپرت سفید',
      price: 1_750_000,
      compareAtPrice: null as number | null,
      inStock: false,
      categoryId: categories['kif-kafsh'],
      brand: 'Seloma',
      shortDescription: 'کفش روزمره سفید',
      description: 'فعلاً ناموجود — به‌زودی موجود می‌شود.',
      tags: ['کفش', 'اسپرت'],
      images: [img('shoes.jpg')],
    },
    {
      sku: 'DRESS-031',
      slug: 'summer-midi-dress',
      title: 'پیراهن میدی تابستانه',
      price: 1_280_000,
      compareAtPrice: 1_650_000,
      inStock: true,
      categoryId: categories.poshak,
      brand: 'Regal',
      shortDescription: 'پارچه سبک، مناسب مهمانی روزانه',
      description: 'پیراهن میدی با الگوی گل‌دار و کمربند پارچه‌ای.',
      tags: ['پیراهن', 'زنانه'],
      images: [img('dress.jpg')],
    },
    {
      sku: 'JACKET-018',
      slug: 'denim-jacket',
      title: 'کت جین کلاسیک',
      price: 2_150_000,
      compareAtPrice: null,
      inStock: true,
      categoryId: categories.poshak,
      brand: 'Seloma',
      shortDescription: 'جین سنگ‌شور با جیب سینه',
      description: 'کت جین یونیسکس، مناسب لایه‌لایه پوشیدن در پاییز.',
      tags: ['کت', 'جین'],
      images: [img('jacket.jpg')],
    },
    {
      sku: 'PANTS-077',
      slug: 'wide-leg-pants',
      title: 'شلوار گشاد کرم',
      price: 980_000,
      compareAtPrice: 1_250_000,
      inStock: true,
      categoryId: categories.poshak,
      brand: 'Regal',
      shortDescription: 'برش گشاد و پارچه نرم',
      description: 'شلوار پارچه‌ای کرم با کش کمر برای راحتی روزانه.',
      tags: ['شلوار', 'کرم'],
      images: [img('pants.jpg')],
    },
    {
      sku: 'SCARF-012',
      slug: 'wool-scarf',
      title: 'شال پشمی راه راه',
      price: 420_000,
      compareAtPrice: null,
      inStock: true,
      categoryId: categories.poshak,
      brand: 'Customme',
      shortDescription: 'اکسسوری پاییزی',
      description: 'شال نرم با ترکیب رنگ خنثی، مناسب کت و پالتو.',
      tags: ['شال', 'پاییزه'],
      images: [img('scarf.jpg')],
    },
    {
      sku: 'WATCH-009',
      slug: 'minimal-watch',
      title: 'ساعت مچی مینیمال',
      price: 3_200_000,
      compareAtPrice: 3_750_000,
      inStock: true,
      categoryId: categories.electronic,
      brand: 'Noir',
      shortDescription: 'صفحه سفید، بند چرمی',
      description: 'ساعت آنالوگ با طراحی ساده برای استفاده روزمره و رسمی.',
      tags: ['ساعت', 'اکسسوری'],
      images: [img('watch.jpg')],
    },
    {
      sku: 'HEAD-440',
      slug: 'studio-headphones',
      title: 'هدفون استودیویی',
      price: 4_890_000,
      compareAtPrice: 5_500_000,
      inStock: true,
      categoryId: categories.electronic,
      brand: 'iCenter',
      shortDescription: 'صدای فراگیر و بالشتک نرم',
      description: 'هدفون روگوشی برای موسیقی و گیم، کابل جداشدنی.',
      tags: ['هدفون', 'گیم'],
      images: [img('headphones.jpg')],
    },
    {
      sku: 'VASE-102',
      slug: 'ceramic-vase',
      title: 'گلدان سرامیکی سفید',
      price: 560_000,
      compareAtPrice: null,
      inStock: true,
      categoryId: categories.khane,
      brand: 'Zi Home',
      shortDescription: 'دکور میز و شلف',
      description: 'گلدان دست‌ساز با لعاب مات، ارتفاع ۲۸ سانتی‌متر.',
      tags: ['گلدان', 'دکور'],
      images: [img('vase.jpg')],
    },
    {
      sku: 'LAMP-210',
      slug: 'desk-lamp',
      title: 'چراغ مطالعه فلزی',
      price: 1_150_000,
      compareAtPrice: 1_390_000,
      inStock: true,
      categoryId: categories.khane,
      brand: 'Zi Home',
      shortDescription: 'بازوی قابل تنظیم',
      description: 'چراغ مطالعه با نور گرم و پایه سنگین برای میز کار.',
      tags: ['چراغ', 'میز'],
      images: [img('lamp.jpg')],
    },
    {
      sku: 'MUG-033',
      slug: 'stoneware-mug',
      title: 'ماگ سرامیکی دست‌ساز',
      price: 185_000,
      compareAtPrice: 240_000,
      inStock: true,
      categoryId: categories.khane,
      brand: 'Customme',
      shortDescription: '۳۵۰ میلی‌لیتر',
      description: 'ماگ ضخیم با دسته راحت؛ مناسب قهوه و چای.',
      tags: ['ماگ', 'آشپزخانه'],
      images: [img('mug.jpg')],
    },
    {
      sku: 'CHAIR-088',
      slug: 'lounge-chair',
      title: 'صندلی راحتی پارچه‌ای',
      price: 8_900_000,
      compareAtPrice: 10_200_000,
      inStock: true,
      categoryId: categories.khane,
      brand: 'Zi Home',
      shortDescription: 'نشیمن عمیق برای پذیرایی',
      description: 'صندلی تک‌نفره با پارچه مقاوم و پایه‌های چوبی.',
      tags: ['مبلمان', 'صندلی'],
      images: [img('chair.jpg')],
    },
    {
      sku: 'PERF-055',
      slug: 'eau-de-parfum',
      title: 'ادوپرفیوم چوبی',
      price: 2_780_000,
      compareAtPrice: 3_200_000,
      inStock: true,
      categoryId: categories.zibayi,
      brand: 'Noir',
      shortDescription: 'رایحه گرم، ماندگاری بالا',
      description: 'عطر ۵۰ میلی‌لیتری با نت‌های چوب و کهربا.',
      tags: ['عطر', 'هدیه'],
      images: [img('perfume.jpg')],
    },
    {
      sku: 'TEE-011',
      slug: 'white-cotton-tee',
      title: 'تی‌شرت نخی سفید',
      price: 420_000,
      compareAtPrice: 560_000,
      inStock: true,
      categoryId: categories.poshak,
      brand: 'Seloma',
      shortDescription: 'برش آزاد، نخ پنبه شانه شده',
      description: 'تی‌شرت سفید ساده برای لایه‌بندی روزمره. بعد از چند بار شست‌وشو فرم خودش را حفظ می‌کند.',
      tags: ['تی‌شرت', 'نخی'],
      images: [img('tee.jpg')],
    },
    {
      sku: 'SNEAK-301',
      slug: 'white-sneakers',
      title: 'کتانی سفید روزمره',
      price: 1_890_000,
      compareAtPrice: 2_250_000,
      inStock: true,
      categoryId: categories['kif-kafsh'],
      brand: 'Seloma',
      shortDescription: 'کفی راحت، مناسب پیاده‌روی شهری',
      description: 'کتانی سفید با رویه پارچه‌ای و کفی نرم. با شلوار گشاد و پیراهن لینن خوب می‌نشیند.',
      tags: ['کفش', 'کتانی'],
      images: [img('sneakers.jpg')],
    },
    {
      sku: 'BELT-044',
      slug: 'leather-belt',
      title: 'کمربند چرمی قهوه‌ای',
      price: 680_000,
      compareAtPrice: null,
      inStock: true,
      categoryId: categories['kif-kafsh'],
      brand: 'Seloma',
      shortDescription: 'چرم طبیعی، سگک مینیمال',
      description: 'کمربند قهوه‌ای با پهنای کلاسیک. با شلوار پارچه‌ای و جین هماهنگ است.',
      tags: ['کمربند', 'چرم'],
      images: [img('belt.jpg')],
    },
    {
      sku: 'CANDLE-090',
      slug: 'cedar-candle',
      title: 'شمع معطر چوب سدر',
      price: 390_000,
      compareAtPrice: 480_000,
      inStock: true,
      categoryId: categories.khane,
      brand: 'Atelier',
      shortDescription: 'سوخت حدود ۴۰ ساعت',
      description: 'شمع گیاهی با رایحه چوب سدر. برای میز ناهارخوری و شلف کنار گلدان مناسب است.',
      tags: ['شمع', 'خانه'],
      images: [img('candle.jpg')],
    },
    {
      sku: 'SOCK-015',
      slug: 'cotton-socks',
      title: 'جوراب نخی سه‌تایی',
      price: 210_000,
      compareAtPrice: 280_000,
      inStock: true,
      categoryId: categories.poshak,
      brand: 'Seloma',
      shortDescription: 'بسته سه جفت، رنگ خنثی',
      description: 'جوراب نخی با بافت متراکم. مناسب استفاده روزانه با کتانی و کفش رسمی.',
      tags: ['جوراب', 'پک'],
      images: [img('scarf.jpg')],
    },
    {
      sku: 'CREAM-021',
      slug: 'hand-cream',
      title: 'کرم دست گیاهی',
      price: 245_000,
      compareAtPrice: null,
      inStock: true,
      categoryId: categories.zibayi,
      brand: 'Noir',
      shortDescription: '۵۰ میلی‌لیتر، بدون عطر تند',
      description: 'کرم دست سبک با بافت سریع‌جذب. برای هدیه همراه عطر یا ماگ انتخاب خوبی است.',
      tags: ['مراقبت', 'هدیه'],
      images: [img('cream.jpg')],
    },
    {
      sku: 'CASE-220',
      slug: 'headphone-case',
      title: 'کیف هدفون',
      price: 310_000,
      compareAtPrice: 390_000,
      inStock: true,
      categoryId: categories.electronic,
      brand: 'Pulse',
      shortDescription: 'زیپ‌دار، آستر نرم',
      description: 'کیف جمع‌وجور برای هدفون و کابل. داخل جیب کیف روزانه جا می‌شود.',
      tags: ['گجت', 'کیف'],
      images: [img('headphones.jpg')],
    },
    {
      sku: 'BOOK-011',
      slug: 'ceramic-bookend',
      title: 'نگهدارنده کتاب سرامیکی',
      price: 540_000,
      compareAtPrice: null,
      inStock: true,
      categoryId: categories.khane,
      brand: 'Atelier',
      shortDescription: 'یک جفت، لعاب مات',
      description: 'نگهدارنده کتاب سرامیکی مات. کنار گلدان و چراغ مطالعه روی شلف خوب دیده می‌شود.',
      tags: ['دکور', 'کتاب'],
      images: [img('vase.jpg')],
    },
  ];

  for (const item of products) {
    const row = await prisma.product.upsert({
      where: { tenantId_sku: { tenantId, sku: item.sku } },
      create: {
        tenantId,
        sku: item.sku,
        slug: item.slug,
        title: item.title,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        currency: 'IRR',
        inStock: item.inStock,
        description: item.description,
        shortDescription: item.shortDescription,
        brand: item.brand,
        tags: item.tags,
        images: item.images,
        categoryId: item.categoryId,
        source: 'native',
        status: 'published',
      },
      update: {
        title: item.title,
        slug: item.slug,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        inStock: item.inStock,
        description: item.description,
        shortDescription: item.shortDescription,
        brand: item.brand,
        tags: item.tags,
        images: item.images,
        categoryId: item.categoryId,
        source: 'native',
        status: 'published',
      },
    });
    const level = await prisma.inventoryLevel.findFirst({
      where: { tenantId, productId: row.id, variantId: null },
    });
    if (!level) {
      await prisma.inventoryLevel.create({
        data: {
          tenantId,
          productId: row.id,
          onHand: 10 + (item.sku.length % 18),
          reserved: 0,
          lowStockThreshold: 4,
        },
      });
    }
  }

  const articles = [
    {
      slug: 'linen-care',
      title: 'چطور پیراهن لینن را بشوییم؟',
      excerpt: 'نکات ساده برای اینکه لینن بعد از شست‌وشو فرم و رنگش را حفظ کند.',
      content:
        'لینن را با آب ولرم و برنامه ملایم بشویید. از سفیدکننده استفاده نکنید و در سایه خشک کنید. اتو را روی پارچه کمی نم‌دار بزنید تا چروک‌ها باز شوند.',
      featuredImageUrl: img('article-1.jpg'),
      categoryId: categories.poshak,
      tags: ['لینن', 'نگهداری'],
    },
    {
      slug: 'home-styling',
      title: 'چیدمان شلف با گلدان و چراغ',
      excerpt: 'چند قانون ساده برای اینکه گوشه خانه شلوغ به نظر نرسد.',
      content:
        'ارتفاع‌ها را عوض کنید: گلدان بلند، کتاب، سپس چراغ کوچک. رنگ‌ها را به دو یا سه تن محدود کنید تا شلف آرام بماند.',
      featuredImageUrl: img('article-2.jpg'),
      categoryId: categories.khane,
      tags: ['دکور', 'خانه'],
    },
    {
      slug: 'gift-guide',
      title: 'هدیه زیر سه میلیون تومان',
      excerpt: 'ساعت، عطر و ماگ — انتخاب‌هایی که معمولاً اشتباه نمی‌روند.',
      content:
        'برای هدیه روزمره ماگ یا شال، برای مناسبت رسمی‌تر عطر یا ساعت مینیمال انتخاب کنید. بسته‌بندی ساده بهتر از جعبه شلوغ دیده می‌شود.',
      featuredImageUrl: img('article-4.jpg'),
      categoryId: categories.zibayi,
      tags: ['هدیه', 'راهنما'],
    },
    {
      slug: 'season-look',
      title: 'کالکشن فصل: از پیراهن تا کت جین',
      excerpt: 'چطور سه تکه اصلی کمد را با هم ترکیب کنید.',
      content:
        'پیراهن لینن را با شلوار گشاد بپوشید و برای خنک شدن هوا کت جین اضافه کنید. کیف مشکی همه این‌ها را جمع می‌کند.',
      featuredImageUrl: img('article-3.jpg'),
      categoryId: categories.poshak,
      tags: ['استایل', 'فصل'],
    },
    {
      slug: 'headphone-guide',
      title: 'قبل از خرید هدفون این سه نکته را چک کنید',
      excerpt: 'عایق صدا، وزن و دوام باتری — چیزهایی که در عکس محصول دیده نمی‌شوند.',
      content:
        'اگر در مترو کار می‌کنید عایق صدا مهم‌تر از بیس است. هدفون سبک برای جلسات طولانی بهتر است. شارژ سریع یک‌ساعته معمولاً از ظرفیت خیلی بالا کاربردی‌تر تمام می‌شود.\n\nکیف همراه را دست‌کم نگیرید؛ کابل و سری‌ها سریع گم می‌شوند.',
      featuredImageUrl: img('article-5.jpg'),
      categoryId: categories.electronic,
      tags: ['هدفون', 'خرید'],
    },
    {
      slug: 'weekend-table',
      title: 'میز آخر هفته با شمع و ماگ',
      excerpt: 'چطور با سه وسیله ساده میز را مهمان‌پذیر کنید.',
      content:
        'یک شمع معطر، دو ماگ هم‌سبک و یک گلدان کوتاه کافی است. رومیزی شلوغ را کنار بگذارید و فضای خالی روی میز بگذارید تا وسایل دیده شوند.\n\nاگر نور طبیعی کم است چراغ مطالعه را نزدیک گوشه میز بگذارید تا سایه روی صورت مهمان نیفتد.',
      featuredImageUrl: img('article-6.jpg'),
      categoryId: categories.khane,
      tags: ['میز', 'پذیرایی'],
    },
  ];

  for (const a of articles) {
    await prisma.article.upsert({
      where: { tenantId_slug: { tenantId, slug: a.slug } },
      create: {
        tenantId,
        ...a,
        status: 'published',
        publishedAt: new Date(),
      },
      update: {
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        featuredImageUrl: a.featuredImageUrl,
        categoryId: a.categoryId,
        tags: a.tags,
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }

  const banners = [
    {
      title: 'کالکشن بهاره',
      subtitle: 'تا ۲۵٪ تخفیف روی پوشاک منتخب',
      imageUrl: img('hero-1.jpg'),
      href: '/products',
      sortOrder: 0,
    },
    {
      title: 'نگاه مجله‌ای',
      subtitle: 'پیراهن و شال برای روزهای روشن',
      imageUrl: img('hero-2.jpg'),
      href: '/products?category=poshak',
      sortOrder: 1,
    },
    {
      title: 'خانه آرام',
      subtitle: 'گلدان، چراغ و صندلی راحتی',
      imageUrl: img('hero-3.jpg'),
      href: '/products?category=khane',
      sortOrder: 2,
    },
  ];
  for (const b of banners) {
    const existing = await prisma.storefrontBanner.findFirst({
      where: { tenantId, title: b.title },
    });
    if (existing) {
      await prisma.storefrontBanner.update({
        where: { id: existing.id },
        data: {
          subtitle: b.subtitle,
          imageUrl: b.imageUrl,
          href: b.href,
          sortOrder: b.sortOrder,
          active: true,
        },
      });
    } else {
      await prisma.storefrontBanner.create({
        data: { tenantId, ...b, active: true },
      });
    }
  }

  const settings = await prisma.storefrontSettings.findUnique({
    where: { tenantId },
  });
  if (settings && (!settings.storeSlug || /^-+$/.test(settings.storeSlug))) {
    const taken = await prisma.storefrontSettings.findUnique({
      where: { storeSlug: 'demo' },
    });
    if (!taken || taken.tenantId === tenantId) {
      await prisma.storefrontSettings.update({
        where: { tenantId },
        data: { storeSlug: 'demo' },
      });
    }
  }
}
