export type Gender = "Male" | "Female";
export type FamilyType =
  | "Nuclear"
  | "Joint"
  | "Extended"
  | "Single_Parent"
  | "Other";
export type MaritalStatus =
  | "Never_Married"
  | "Divorced"
  | "Widowed"
  | "Separated"
  | "Awaiting_Divorce"
  | "Second_Marriage"
  | "Annulled";

export interface Sibling {
  name: string;
  relation?: string;
  ageRelation?: string;
  maritalStatus?: string;
  education: string;
  profession: string;
}

export interface Child {
  age: string;
  gender: string;
  stayingWithYou: boolean;
}

export interface Profile {
  id: string;
  profileNumber?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  age: number;
  dateOfBirth?: string;
  gender: Gender;
  religion: string;
  caste: string;
  castePreference?: string;
  marriagePreference?: string;
  complexion?: string;
  city: string;
  state: string;
  homeTown?: string;
  addressCity?: string;
  addressArea?: string;
  currentAddress?: string;
  education: string;
  educationUniversity?: string;
  educationCity?: string;
  occupation: string;
  income: string;
  height: string;
  about: string;
  image: string;
  images: string[];
  privateImageUrls?: string[];
  interests: string[];
  languagesKnown?: string[];
  familyType: FamilyType | string;
  maritalStatus: MaritalStatus | string;
  motherTongue: string;
  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  motherName?: string;
  motherOccupation?: string;
  motherPhone?: string;
  otherPhone?: string;
  coordinatorNumber?: string;
  totalSiblings?: string;
  brotherEducation?: string;
  sisterEducation?: string;
  siblings?: Sibling[];
  hasChildren?: boolean | null;
  children?: Child[];
  otherDetails?: string;
  isPublished?: boolean;
  isVerified?: boolean;
  isVip?: boolean;
  isPremium?: boolean;
  photosRestricted?: boolean;
  restrictedImageUrls?: string[];
  photosUpgradeMessage?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  isVerified?: boolean;
  isProfileVerified?: boolean;
  isVip?: boolean;
  isPremium?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface MeUser extends AuthUser {
  phone?: string;
  gender?: "Male" | "Female";
  dateOfBirth?: string;
  isActive?: boolean;
  isProfileVerified?: boolean;
  isVip?: boolean;
  isPremium?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileImage {
  id: string;
  url: string;
  isPrimary: boolean;
  isPrivate?: boolean;
  sortOrder: number;
}

export interface CreateProfileInput {
  religion: string;
  caste: string;
  city: string;
  state: string;
  education: string;
  educationUniversity?: string;
  occupation: string;
  income: string;
  height: string;
  about: string;
  familyType: FamilyType | string;
  maritalStatus: MaritalStatus;
  motherTongue: string;
  interests: string[];
  // Optional matrimony fields (all nullable on the backend).
  // `age` is NOT included — the backend computes it from the account's dateOfBirth.
  complexion?: string;
  homeTown?: string;
  educationCity?: string;
  castePreference?: string;
  marriagePreference?: string;
  languagesKnown?: string[];
  currentAddress?: string;
  addressCity?: string;
  addressArea?: string;
  motherPhone?: string;
  fatherPhone?: string;
  otherPhone?: string;
  coordinatorNumber?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  totalSiblings?: string;
  brotherEducation?: string;
  sisterEducation?: string;
  siblings?: Sibling[];
  hasChildren?: boolean | null;
  children?: Child[];
  otherDetails?: string;
}

export type UpdateProfileInput = Partial<CreateProfileInput>;

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: { field: string; message: string }[];
}

export interface ProfileFilters {
  profileNumber?: string;
  search?: string;
  gender?: string;
  religion?: string;
  caste?: string;
  city?: string;
  state?: string;
  maritalStatus?: string;
  motherTongue?: string;
  education?: string;
  height?: string;
  income?: string;
  complexion?: string;
  familyType?: string;
  /** Sent as "true" / "false" query string to avoid Nest boolean coercion bugs. */
  hasChildren?: boolean | string;
  ageMin?: number;
  ageMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface ProfileCompletionSection {
  section: string;
  completed: number;
  total: number;
  percentage: number;
  missingFields: string[];
}

export interface ProfileCompletion {
  hasProfile: boolean;
  profileId?: string;
  profileNumber?: string;
  isPublished?: boolean;
  isVerified?: boolean;
  imageCount?: number;
  overallPercentage: number;
  totalCompleted: number;
  totalRequired: number;
  sections: ProfileCompletionSection[];
}
