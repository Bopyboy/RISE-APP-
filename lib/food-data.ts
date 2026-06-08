import { FoodItem } from './types'
import { EXPANDED_FOODS } from './food-data-expanded'

function mergeFoodCategories(base: Record<string, FoodItem[]>): Record<string, FoodItem[]> {
  const merged: Record<string, FoodItem[]> = { ...base }
  for (const [key, items] of Object.entries(EXPANDED_FOODS)) {
    merged[key] = [...(merged[key] ?? []), ...items]
  }
  return merged
}

const BASE_FOOD_DATABASE: Record<string, FoodItem[]> = {
  protein: [
    { id: 'p1', name: 'Chicken Breast', servingSize: '100g', servingGrams: 100, calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    { id: 'p2', name: 'Beef Steak (Sirloin)', servingSize: '100g', servingGrams: 100, calories: 271, protein: 26, carbs: 0, fats: 17 },
    { id: 'p3', name: 'Salmon Fillet', servingSize: '100g', servingGrams: 100, calories: 208, protein: 20, carbs: 0, fats: 13 },
    { id: 'p4', name: 'Ground Turkey', servingSize: '100g', servingGrams: 100, calories: 149, protein: 19, carbs: 0, fats: 8 },
    { id: 'p5', name: 'Eggs (whole)', servingSize: '1 large (50g)', servingGrams: 50, calories: 78, protein: 6, carbs: 0.6, fats: 5 },
    { id: 'p6', name: 'Egg Whites', servingSize: '100g', servingGrams: 100, calories: 52, protein: 11, carbs: 0.7, fats: 0.2 },
    { id: 'p7', name: 'Tuna (canned)', servingSize: '100g', servingGrams: 100, calories: 116, protein: 26, carbs: 0, fats: 0.8 },
    { id: 'p8', name: 'Shrimp', servingSize: '100g', servingGrams: 100, calories: 99, protein: 24, carbs: 0.2, fats: 0.3 },
    { id: 'p9', name: 'Pork Tenderloin', servingSize: '100g', servingGrams: 100, calories: 143, protein: 26, carbs: 0, fats: 3.5 },
    { id: 'p10', name: 'Cod Fish', servingSize: '100g', servingGrams: 100, calories: 82, protein: 18, carbs: 0, fats: 0.7 },
    { id: 'p11', name: 'Tofu (firm)', servingSize: '100g', servingGrams: 100, calories: 144, protein: 17, carbs: 3, fats: 8 },
    { id: 'p12', name: 'Tempeh', servingSize: '100g', servingGrams: 100, calories: 192, protein: 20, carbs: 8, fats: 11 },
    { id: 'p13', name: 'Greek Yogurt (plain)', servingSize: '100g', servingGrams: 100, calories: 97, protein: 9, carbs: 3.6, fats: 5 },
    { id: 'p14', name: 'Cottage Cheese', servingSize: '100g', servingGrams: 100, calories: 98, protein: 11, carbs: 3.4, fats: 4.3 },
    { id: 'p15', name: 'Whey Protein Powder', servingSize: '1 scoop (30g)', servingGrams: 30, calories: 120, protein: 24, carbs: 3, fats: 1 },
  ],
  carbs: [
    { id: 'c1', name: 'White Rice (cooked)', servingSize: '100g', servingGrams: 100, calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
    { id: 'c2', name: 'Brown Rice (cooked)', servingSize: '100g', servingGrams: 100, calories: 112, protein: 2.6, carbs: 24, fats: 0.9 },
    { id: 'c3', name: 'Pasta (cooked)', servingSize: '100g', servingGrams: 100, calories: 131, protein: 5, carbs: 25, fats: 1.1 },
    { id: 'c4', name: 'Oatmeal (cooked)', servingSize: '100g', servingGrams: 100, calories: 71, protein: 2.5, carbs: 12, fats: 1.5 },
    { id: 'c5', name: 'Quinoa (cooked)', servingSize: '100g', servingGrams: 100, calories: 120, protein: 4.4, carbs: 21, fats: 1.9 },
    { id: 'c6', name: 'Sweet Potato', servingSize: '100g', servingGrams: 100, calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
    { id: 'c7', name: 'White Potato', servingSize: '100g', servingGrams: 100, calories: 77, protein: 2, carbs: 17, fats: 0.1 },
    { id: 'c8', name: 'Whole Wheat Bread', servingSize: '1 slice (30g)', servingGrams: 30, calories: 81, protein: 4, carbs: 14, fats: 1.1 },
    { id: 'c9', name: 'White Bread', servingSize: '1 slice (25g)', servingGrams: 25, calories: 66, protein: 2, carbs: 13, fats: 0.8 },
    { id: 'c10', name: 'Bagel', servingSize: '1 medium (98g)', servingGrams: 98, calories: 277, protein: 11, carbs: 54, fats: 1.4 },
    { id: 'c11', name: 'Tortilla (flour)', servingSize: '1 medium (45g)', servingGrams: 45, calories: 140, protein: 3.5, carbs: 24, fats: 3.5 },
    { id: 'c12', name: 'Couscous (cooked)', servingSize: '100g', servingGrams: 100, calories: 112, protein: 3.8, carbs: 23, fats: 0.2 },
    { id: 'c13', name: 'Corn (cooked)', servingSize: '100g', servingGrams: 100, calories: 96, protein: 3.4, carbs: 21, fats: 1.5 },
    { id: 'c14', name: 'Granola', servingSize: '50g', servingGrams: 50, calories: 225, protein: 5, carbs: 33, fats: 9 },
    { id: 'c15', name: 'Cereal (bran flakes)', servingSize: '30g', servingGrams: 30, calories: 96, protein: 3, carbs: 23, fats: 0.5 },
  ],
  fats: [
    { id: 'f1', name: 'Avocado', servingSize: '100g', servingGrams: 100, calories: 160, protein: 2, carbs: 9, fats: 15 },
    { id: 'f2', name: 'Olive Oil', servingSize: '1 tbsp (14g)', servingGrams: 14, calories: 119, protein: 0, carbs: 0, fats: 14 },
    { id: 'f3', name: 'Almonds', servingSize: '30g', servingGrams: 30, calories: 173, protein: 6, carbs: 6, fats: 15 },
    { id: 'f4', name: 'Peanut Butter', servingSize: '2 tbsp (32g)', servingGrams: 32, calories: 188, protein: 8, carbs: 6, fats: 16 },
    { id: 'f5', name: 'Walnuts', servingSize: '30g', servingGrams: 30, calories: 196, protein: 4.6, carbs: 4, fats: 19.5 },
    { id: 'f6', name: 'Cashews', servingSize: '30g', servingGrams: 30, calories: 163, protein: 4.3, carbs: 9.3, fats: 13 },
    { id: 'f7', name: 'Coconut Oil', servingSize: '1 tbsp (14g)', servingGrams: 14, calories: 121, protein: 0, carbs: 0, fats: 13.5 },
    { id: 'f8', name: 'Butter', servingSize: '1 tbsp (14g)', servingGrams: 14, calories: 102, protein: 0.1, carbs: 0, fats: 11.5 },
    { id: 'f9', name: 'Chia Seeds', servingSize: '2 tbsp (28g)', servingGrams: 28, calories: 138, protein: 4.7, carbs: 12, fats: 8.7 },
    { id: 'f10', name: 'Flax Seeds', servingSize: '2 tbsp (20g)', servingGrams: 20, calories: 107, protein: 3.7, carbs: 5.8, fats: 8.5 },
    { id: 'f11', name: 'Macadamia Nuts', servingSize: '30g', servingGrams: 30, calories: 214, protein: 2.2, carbs: 4, fats: 22.5 },
    { id: 'f12', name: 'Pecans', servingSize: '30g', servingGrams: 30, calories: 207, protein: 2.7, carbs: 4.1, fats: 21.5 },
    { id: 'f13', name: 'Sunflower Seeds', servingSize: '30g', servingGrams: 30, calories: 175, protein: 6.2, carbs: 6, fats: 15.3 },
    { id: 'f14', name: 'Tahini', servingSize: '2 tbsp (30g)', servingGrams: 30, calories: 178, protein: 5.1, carbs: 6.4, fats: 16 },
    { id: 'f15', name: 'Dark Chocolate (70%)', servingSize: '30g', servingGrams: 30, calories: 170, protein: 2.2, carbs: 13, fats: 12 },
  ],
  fiber: [
    { id: 'fb1', name: 'Lentils (cooked)', servingSize: '100g', servingGrams: 100, calories: 116, protein: 9, carbs: 20, fats: 0.4 },
    { id: 'fb2', name: 'Black Beans (cooked)', servingSize: '100g', servingGrams: 100, calories: 132, protein: 8.9, carbs: 24, fats: 0.5 },
    { id: 'fb3', name: 'Chickpeas (cooked)', servingSize: '100g', servingGrams: 100, calories: 164, protein: 8.9, carbs: 27, fats: 2.6 },
    { id: 'fb4', name: 'Kidney Beans (cooked)', servingSize: '100g', servingGrams: 100, calories: 127, protein: 8.7, carbs: 23, fats: 0.5 },
    { id: 'fb5', name: 'Split Peas (cooked)', servingSize: '100g', servingGrams: 100, calories: 118, protein: 8.3, carbs: 21, fats: 0.4 },
    { id: 'fb6', name: 'Edamame', servingSize: '100g', servingGrams: 100, calories: 121, protein: 11, carbs: 9, fats: 5 },
    { id: 'fb7', name: 'Artichoke', servingSize: '1 medium (120g)', servingGrams: 120, calories: 60, protein: 4.2, carbs: 13, fats: 0.2 },
    { id: 'fb8', name: 'Green Peas', servingSize: '100g', servingGrams: 100, calories: 81, protein: 5.4, carbs: 14, fats: 0.4 },
    { id: 'fb9', name: 'Brussels Sprouts', servingSize: '100g', servingGrams: 100, calories: 43, protein: 3.4, carbs: 9, fats: 0.3 },
    { id: 'fb10', name: 'Bran Cereal', servingSize: '30g', servingGrams: 30, calories: 76, protein: 4, carbs: 23, fats: 0.9 },
    { id: 'fb11', name: 'Pinto Beans (cooked)', servingSize: '100g', servingGrams: 100, calories: 143, protein: 9, carbs: 26, fats: 0.6 },
    { id: 'fb12', name: 'Navy Beans (cooked)', servingSize: '100g', servingGrams: 100, calories: 140, protein: 8.2, carbs: 26, fats: 0.6 },
    { id: 'fb13', name: 'Psyllium Husk', servingSize: '1 tbsp (9g)', servingGrams: 9, calories: 25, protein: 0, carbs: 6, fats: 0 },
    { id: 'fb14', name: 'Chia Seeds', servingSize: '2 tbsp (28g)', servingGrams: 28, calories: 138, protein: 4.7, carbs: 12, fats: 8.7 },
    { id: 'fb15', name: 'Popcorn (air-popped)', servingSize: '30g', servingGrams: 30, calories: 116, protein: 3.6, carbs: 23, fats: 1.4 },
  ],
  fruits: [
    { id: 'fr1', name: 'Banana', servingSize: '1 medium (118g)', servingGrams: 118, calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
    { id: 'fr2', name: 'Apple', servingSize: '1 medium (182g)', servingGrams: 182, calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
    { id: 'fr3', name: 'Orange', servingSize: '1 medium (131g)', servingGrams: 131, calories: 62, protein: 1.2, carbs: 15, fats: 0.2 },
    { id: 'fr4', name: 'Strawberries', servingSize: '100g', servingGrams: 100, calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3 },
    { id: 'fr5', name: 'Blueberries', servingSize: '100g', servingGrams: 100, calories: 57, protein: 0.7, carbs: 14, fats: 0.3 },
    { id: 'fr6', name: 'Grapes', servingSize: '100g', servingGrams: 100, calories: 69, protein: 0.7, carbs: 18, fats: 0.2 },
    { id: 'fr7', name: 'Mango', servingSize: '100g', servingGrams: 100, calories: 60, protein: 0.8, carbs: 15, fats: 0.4 },
    { id: 'fr8', name: 'Pineapple', servingSize: '100g', servingGrams: 100, calories: 50, protein: 0.5, carbs: 13, fats: 0.1 },
    { id: 'fr9', name: 'Watermelon', servingSize: '100g', servingGrams: 100, calories: 30, protein: 0.6, carbs: 8, fats: 0.2 },
    { id: 'fr10', name: 'Peach', servingSize: '1 medium (150g)', servingGrams: 150, calories: 59, protein: 1.4, carbs: 14, fats: 0.4 },
    { id: 'fr11', name: 'Pear', servingSize: '1 medium (178g)', servingGrams: 178, calories: 102, protein: 0.6, carbs: 27, fats: 0.2 },
    { id: 'fr12', name: 'Cherries', servingSize: '100g', servingGrams: 100, calories: 63, protein: 1.1, carbs: 16, fats: 0.2 },
    { id: 'fr13', name: 'Kiwi', servingSize: '1 medium (69g)', servingGrams: 69, calories: 42, protein: 0.8, carbs: 10, fats: 0.4 },
    { id: 'fr14', name: 'Raspberries', servingSize: '100g', servingGrams: 100, calories: 52, protein: 1.2, carbs: 12, fats: 0.7 },
    { id: 'fr15', name: 'Cantaloupe', servingSize: '100g', servingGrams: 100, calories: 34, protein: 0.8, carbs: 8, fats: 0.2 },
  ],
  vegetables: [
    { id: 'v1', name: 'Broccoli', servingSize: '100g', servingGrams: 100, calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
    { id: 'v2', name: 'Spinach (raw)', servingSize: '100g', servingGrams: 100, calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
    { id: 'v3', name: 'Kale', servingSize: '100g', servingGrams: 100, calories: 49, protein: 4.3, carbs: 9, fats: 0.9 },
    { id: 'v4', name: 'Carrots', servingSize: '100g', servingGrams: 100, calories: 41, protein: 0.9, carbs: 10, fats: 0.2 },
    { id: 'v5', name: 'Bell Pepper', servingSize: '1 medium (119g)', servingGrams: 119, calories: 31, protein: 1, carbs: 6, fats: 0.3 },
    { id: 'v6', name: 'Tomato', servingSize: '1 medium (123g)', servingGrams: 123, calories: 22, protein: 1.1, carbs: 4.8, fats: 0.2 },
    { id: 'v7', name: 'Cucumber', servingSize: '100g', servingGrams: 100, calories: 16, protein: 0.7, carbs: 3.6, fats: 0.1 },
    { id: 'v8', name: 'Zucchini', servingSize: '100g', servingGrams: 100, calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3 },
    { id: 'v9', name: 'Cauliflower', servingSize: '100g', servingGrams: 100, calories: 25, protein: 1.9, carbs: 5, fats: 0.3 },
    { id: 'v10', name: 'Asparagus', servingSize: '100g', servingGrams: 100, calories: 20, protein: 2.2, carbs: 3.9, fats: 0.1 },
    { id: 'v11', name: 'Green Beans', servingSize: '100g', servingGrams: 100, calories: 31, protein: 1.8, carbs: 7, fats: 0.1 },
    { id: 'v12', name: 'Mushrooms', servingSize: '100g', servingGrams: 100, calories: 22, protein: 3.1, carbs: 3.3, fats: 0.3 },
    { id: 'v13', name: 'Onion', servingSize: '1 medium (110g)', servingGrams: 110, calories: 44, protein: 1.2, carbs: 10, fats: 0.1 },
    { id: 'v14', name: 'Celery', servingSize: '100g', servingGrams: 100, calories: 16, protein: 0.7, carbs: 3, fats: 0.2 },
    { id: 'v15', name: 'Lettuce (romaine)', servingSize: '100g', servingGrams: 100, calories: 17, protein: 1.2, carbs: 3.3, fats: 0.3 },
  ],
  dairy: [
    { id: 'd1', name: 'Whole Milk', servingSize: '1 cup (244g)', servingGrams: 244, calories: 149, protein: 8, carbs: 12, fats: 8 },
    { id: 'd2', name: 'Skim Milk', servingSize: '1 cup (245g)', servingGrams: 245, calories: 83, protein: 8.3, carbs: 12, fats: 0.2 },
    { id: 'd3', name: 'Greek Yogurt (plain)', servingSize: '100g', servingGrams: 100, calories: 97, protein: 9, carbs: 3.6, fats: 5 },
    { id: 'd4', name: 'Regular Yogurt', servingSize: '100g', servingGrams: 100, calories: 59, protein: 3.5, carbs: 5, fats: 3.3 },
    { id: 'd5', name: 'Cheddar Cheese', servingSize: '30g', servingGrams: 30, calories: 120, protein: 7, carbs: 0.4, fats: 10 },
    { id: 'd6', name: 'Mozzarella Cheese', servingSize: '30g', servingGrams: 30, calories: 85, protein: 6, carbs: 0.6, fats: 6 },
    { id: 'd7', name: 'Parmesan Cheese', servingSize: '30g', servingGrams: 30, calories: 111, protein: 10, carbs: 0.9, fats: 7.3 },
    { id: 'd8', name: 'Cottage Cheese', servingSize: '100g', servingGrams: 100, calories: 98, protein: 11, carbs: 3.4, fats: 4.3 },
    { id: 'd9', name: 'Cream Cheese', servingSize: '2 tbsp (29g)', servingGrams: 29, calories: 99, protein: 1.7, carbs: 1.6, fats: 9.9 },
    { id: 'd10', name: 'Butter', servingSize: '1 tbsp (14g)', servingGrams: 14, calories: 102, protein: 0.1, carbs: 0, fats: 11.5 },
    { id: 'd11', name: 'Heavy Cream', servingSize: '2 tbsp (30g)', servingGrams: 30, calories: 103, protein: 0.6, carbs: 0.8, fats: 11 },
    { id: 'd12', name: 'Sour Cream', servingSize: '2 tbsp (30g)', servingGrams: 30, calories: 60, protein: 0.8, carbs: 1.2, fats: 5.8 },
    { id: 'd13', name: 'Feta Cheese', servingSize: '30g', servingGrams: 30, calories: 79, protein: 4.3, carbs: 1.2, fats: 6.4 },
    { id: 'd14', name: 'Ricotta Cheese', servingSize: '100g', servingGrams: 100, calories: 174, protein: 11, carbs: 3, fats: 13 },
    { id: 'd15', name: 'Almond Milk (unsweetened)', servingSize: '1 cup (240g)', servingGrams: 240, calories: 30, protein: 1, carbs: 1, fats: 2.5 },
  ],
  snacks: [
    { id: 's1', name: 'Protein Bar', servingSize: '1 bar (60g)', servingGrams: 60, calories: 200, protein: 20, carbs: 22, fats: 6 },
    { id: 's2', name: 'Trail Mix', servingSize: '30g', servingGrams: 30, calories: 137, protein: 4, carbs: 13, fats: 9 },
    { id: 's3', name: 'Rice Cakes', servingSize: '2 cakes (18g)', servingGrams: 18, calories: 70, protein: 1.4, carbs: 15, fats: 0.5 },
    { id: 's4', name: 'Dark Chocolate (70%)', servingSize: '30g', servingGrams: 30, calories: 170, protein: 2.2, carbs: 13, fats: 12 },
    { id: 's5', name: 'Hummus', servingSize: '2 tbsp (30g)', servingGrams: 30, calories: 50, protein: 1.4, carbs: 4.5, fats: 3 },
    { id: 's6', name: 'Pretzels', servingSize: '30g', servingGrams: 30, calories: 110, protein: 2.6, carbs: 23, fats: 1 },
    { id: 's7', name: 'Popcorn (butter)', servingSize: '30g', servingGrams: 30, calories: 155, protein: 2.5, carbs: 16, fats: 9 },
    { id: 's8', name: 'Cheese Crackers', servingSize: '30g', servingGrams: 30, calories: 150, protein: 3, carbs: 17, fats: 8 },
    { id: 's9', name: 'Granola Bar', servingSize: '1 bar (40g)', servingGrams: 40, calories: 190, protein: 4, carbs: 28, fats: 7 },
    { id: 's10', name: 'Beef Jerky', servingSize: '30g', servingGrams: 30, calories: 116, protein: 9.4, carbs: 3.1, fats: 7.3 },
    { id: 's11', name: 'String Cheese', servingSize: '1 stick (28g)', servingGrams: 28, calories: 80, protein: 7, carbs: 0.6, fats: 6 },
    { id: 's12', name: 'Peanut Butter Cups', servingSize: '2 cups (42g)', servingGrams: 42, calories: 210, protein: 5, carbs: 24, fats: 12 },
    { id: 's13', name: 'Chips (potato)', servingSize: '30g', servingGrams: 30, calories: 160, protein: 2, carbs: 15, fats: 10 },
    { id: 's14', name: 'Cookies (chocolate chip)', servingSize: '2 cookies (30g)', servingGrams: 30, calories: 148, protein: 1.8, carbs: 20, fats: 7 },
    { id: 's15', name: 'Ice Cream (vanilla)', servingSize: '100g', servingGrams: 100, calories: 207, protein: 3.5, carbs: 24, fats: 11 },
  ],
}

export const FOOD_DATABASE = mergeFoodCategories(BASE_FOOD_DATABASE)

export const FOOD_CATEGORIES = [
  { id: 'protein', name: 'Protein', icon: '🥩' },
  { id: 'carbs', name: 'Carbs', icon: '🍚' },
  { id: 'fats', name: 'Fats', icon: '🥑' },
  { id: 'fiber', name: 'Fiber', icon: '🥗' },
  { id: 'fruits', name: 'Fruits', icon: '🍌' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥦' },
  { id: 'dairy', name: 'Dairy', icon: '🥛' },
  { id: 'snacks', name: 'Snacks', icon: '🍫' },
  { id: 'beverages', name: 'Beverages', icon: '🥤' },
  { id: 'breakfast', name: 'Breakfast', icon: '🍳' },
  { id: 'fastfood', name: 'Fast Food', icon: '🍔' },
  { id: 'mexican', name: 'Mexican', icon: '🌮' },
  { id: 'asian', name: 'Asian', icon: '🍜' },
  { id: 'prepared', name: 'Meals', icon: '🥡' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
]

export function getFoodCount(): number {
  return Object.values(FOOD_DATABASE).reduce((sum, cat) => sum + cat.length, 0)
}

export function searchFoods(query: string): FoodItem[] {
  const lowerQuery = query.toLowerCase()
  const results: FoodItem[] = []
  
  Object.values(FOOD_DATABASE).forEach(category => {
    category.forEach(food => {
      if (food.name.toLowerCase().includes(lowerQuery)) {
        results.push(food)
      }
    })
  })
  
  return results.slice(0, 50)
}
