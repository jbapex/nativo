// Usar banco de dados próprio em vez do Base44
// Para voltar ao Base44, descomente as linhas abaixo e comente o import de entities-local

// import { base44 } from './base44Client';
// export const Product = base44.entities.Product;
// export const City = base44.entities.City;
// export const Category = base44.entities.Category;
// export const Plan = base44.entities.Plan;
// export const Subscription = base44.entities.Subscription;
// export const Store = base44.entities.Store;
// export const User = base44.auth;

// Usando banco de dados próprio
export {
  Product,
  Category,
  Store,
  City,
  Plan,
  Subscription,
  User,
  Settings,
  StoreCustomizations,
  Reviews,
  Favorites,
  Notifications,
  Orders
} from './entities-local';