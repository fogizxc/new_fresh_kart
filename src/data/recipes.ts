export interface RecipeIngredient {
  name: string;
  quantity: string;
  category: string;
  defaultPrice: number;
  productKeyword: string;
  icon?: string;
}

export interface RecipeBundle {
  id: string;
  title: string;
  tagline: string;
  prepTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Quick';
  cuisine: string;
  calories: string;
  imageUrl: string;
  badge: string;
  description: string;
  ingredients: RecipeIngredient[];
  chefTip: string;
}

export const RECIPE_BUNDLES: RecipeBundle[] = [
  {
    id: 'paneer-butter-masala',
    title: 'Restaurant Style Paneer Butter Masala',
    tagline: 'Velvety makhani gravy with fresh malai paneer cubes',
    prepTime: '25 mins',
    servings: 3,
    difficulty: 'Easy',
    cuisine: 'North Indian',
    calories: '380 kcal / serving',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700&q=80',
    badge: 'Popular Kit',
    description: 'A creamy, mildly sweet and spiced tomato-butter gravy loaded with soft fresh paneer. Made with 100% farm-fresh vegetables and dairy.',
    chefTip: 'Soak paneer in warm water for 5 minutes before adding to the gravy to keep it exceptionally soft and spongy.',
    ingredients: [
      { name: 'Fresh Malai Paneer 200g', quantity: '200g', category: 'Dairy & Eggs', defaultPrice: 95, productKeyword: 'paneer', icon: '🧀' },
      { name: 'Ripe Hybrid Tomatoes 500g', quantity: '500g', category: 'Vegetables', defaultPrice: 28, productKeyword: 'tomato', icon: '🍅' },
      { name: 'Fresh Salted Butter 100g', quantity: '100g', category: 'Dairy & Eggs', defaultPrice: 58, productKeyword: 'butter', icon: '🧈' },
      { name: 'Fresh Heavy Dairy Cream 200ml', quantity: '200ml', category: 'Dairy & Eggs', defaultPrice: 70, productKeyword: 'cream', icon: '🥛' },
      { name: 'Ginger & Garlic Paste 100g', quantity: '1 pouch', category: 'Pantry', defaultPrice: 35, productKeyword: 'garlic', icon: '🧄' },
      { name: 'Kasuri Methi (Fenugreek Leaves) 50g', quantity: '1 box', category: 'Pantry', defaultPrice: 30, productKeyword: 'methi', icon: '🌿' }
    ]
  },
  {
    id: 'dal-tadka-jeera-rice',
    title: 'Homestyle Dal Tadka & Jeera Rice',
    tagline: 'Comforting yellow toor dal with aromatic ghee cumin tempering',
    prepTime: '20 mins',
    servings: 4,
    difficulty: 'Quick',
    cuisine: 'Indian Comfort',
    calories: '320 kcal / serving',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=700&q=80',
    badge: 'Daily Favorite',
    description: 'Golden simmered lentils cooked with fresh turmeric, finished with a sizzling tadka of pure desi ghee, cumin seeds, garlic, and fresh green chilies.',
    chefTip: 'Fry the garlic until golden brown in ghee just before pouring the tempering over the dal for the authentic dhaba aroma.',
    ingredients: [
      { name: 'Unpolished Toor Dal 500g', quantity: '500g', category: 'Pantry', defaultPrice: 85, productKeyword: 'dal', icon: '🌾' },
      { name: 'Pure Desi Cow Ghee 200ml', quantity: '200ml', category: 'Dairy & Eggs', defaultPrice: 160, productKeyword: 'ghee', icon: '🏺' },
      { name: 'Cumin Seeds (Jeera) 100g', quantity: '100g', category: 'Pantry', defaultPrice: 45, productKeyword: 'jeera', icon: '🌱' },
      { name: 'Fresh Garlic 250g', quantity: '250g', category: 'Vegetables', defaultPrice: 40, productKeyword: 'garlic', icon: '🧄' },
      { name: 'Spicy Green Chillies 100g', quantity: '100g', category: 'Vegetables', defaultPrice: 15, productKeyword: 'chilli', icon: '🌶️' },
      { name: 'Fresh Coriander Bunch', quantity: '1 bunch', category: 'Vegetables', defaultPrice: 15, productKeyword: 'coriander', icon: '🌿' }
    ]
  },
  {
    id: 'power-breakfast-kit',
    title: 'High-Protein Breakfast Boost',
    tagline: 'Farm fresh eggs, multigrain toast, butter & fresh bananas',
    prepTime: '10 mins',
    servings: 2,
    difficulty: 'Quick',
    cuisine: 'Continental',
    calories: '410 kcal / serving',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=700&q=80',
    badge: 'Morning Special',
    description: 'Kickstart your morning with sunny-side up or fluffy scrambled eggs, crunchy toasted whole wheat sourdough bread, and potassium-rich ripe bananas.',
    chefTip: 'Toast the bread on a low flame skillet with a small dab of butter for maximum crispiness without burning the crust.',
    ingredients: [
      { name: 'Organic Farm Brown Eggs 6-Pack', quantity: '6 pcs', category: 'Dairy & Eggs', defaultPrice: 65, productKeyword: 'egg', icon: '🥚' },
      { name: '100% Whole Wheat Bread Loaf', quantity: '400g', category: 'Pantry', defaultPrice: 50, productKeyword: 'bread', icon: '🍞' },
      { name: 'Salted Table Butter 100g', quantity: '100g', category: 'Dairy & Eggs', defaultPrice: 58, productKeyword: 'butter', icon: '🧈' },
      { name: 'Cavendish Robusta Bananas 500g', quantity: '500g', category: 'Fruits', defaultPrice: 40, productKeyword: 'banana', icon: '🍌' },
      { name: 'Pasteurised Toned Milk 500ml', quantity: '500ml', category: 'Dairy & Eggs', defaultPrice: 36, productKeyword: 'milk', icon: '🥛' }
    ]
  },
  {
    id: 'south-indian-sambar',
    title: 'Traditional South Indian Sambar Feast',
    tagline: 'Tangy tamarind lentil stew with drumsticks & shallots',
    prepTime: '30 mins',
    servings: 4,
    difficulty: 'Medium',
    cuisine: 'South Indian',
    calories: '260 kcal / serving',
    imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=700&q=80',
    badge: 'Authentic',
    description: 'Fragrant and tangy stew cooked with fresh tender drumsticks, shallots (sambar onions), tomatoes, tamarind pulp, and aromatic roasted spices.',
    chefTip: 'Crush fresh curry leaves lightly in your palms before adding to the tadka to release their essential oils.',
    ingredients: [
      { name: 'Fresh Green Drumsticks 250g', quantity: '250g', category: 'Vegetables', defaultPrice: 35, productKeyword: 'drumstick', icon: '🥢' },
      { name: 'Small Sambar Shallots 250g', quantity: '250g', category: 'Vegetables', defaultPrice: 40, productKeyword: 'onion', icon: '🧅' },
      { name: 'Seedless Tamarind 200g', quantity: '200g', category: 'Pantry', defaultPrice: 55, productKeyword: 'tamarind', icon: '🟤' },
      { name: 'Traditional Sambar Masala Powder 100g', quantity: '100g', category: 'Pantry', defaultPrice: 45, productKeyword: 'masala', icon: '🧂' },
      { name: 'Aromatic Curry Leaves 50g', quantity: '50g', category: 'Vegetables', defaultPrice: 10, productKeyword: 'curry', icon: '🍃' }
    ]
  },
  {
    id: 'green-detox-salad',
    title: 'Fresh Garden Detox Salad',
    tagline: 'Hydrating crisp cucumbers, sweet cherry tomatoes & baby greens',
    prepTime: '8 mins',
    servings: 2,
    difficulty: 'Quick',
    cuisine: 'Health & Wellness',
    calories: '140 kcal / serving',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700&q=80',
    badge: 'Clean Eating',
    description: 'Refreshing and vitamin-rich farm-to-table bowl packed with diced English cucumbers, juicy red cherry tomatoes, and tangy fresh lemon dressing.',
    chefTip: 'Sprinkle pink rock salt and fresh cracked black pepper just before serving to avoid vegetables releasing excess water.',
    ingredients: [
      { name: 'Crisp English Seedless Cucumbers 500g', quantity: '500g', category: 'Vegetables', defaultPrice: 35, productKeyword: 'cucumber', icon: '🥒' },
      { name: 'Ripe Cherry Tomatoes 250g', quantity: '250g', category: 'Vegetables', defaultPrice: 45, productKeyword: 'tomato', icon: '🍅' },
      { name: 'Hydroponic Tender Baby Spinach 200g', quantity: '200g', category: 'Vegetables', defaultPrice: 40, productKeyword: 'spinach', icon: '🥬' },
      { name: 'Juicy Yellow Lemons 4-Pack', quantity: '4 pcs', category: 'Fruits', defaultPrice: 25, productKeyword: 'lemon', icon: '🍋' },
      { name: 'Black Chia Seeds 100g', quantity: '100g', category: 'Pantry', defaultPrice: 65, productKeyword: 'chia', icon: '✨' }
    ]
  }
];
