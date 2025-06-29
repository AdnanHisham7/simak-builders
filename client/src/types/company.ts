export interface ICompany {
  id: number;
  name: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  location: string;
  description: string;
  categories: string[];
  image: string;
  logoColor?: string;
  initials?: string;
}