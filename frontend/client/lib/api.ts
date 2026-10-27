const API_BASE = `${import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? ""}/api/v1`;

export type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type BackendPropertyRoom = {
  name: string;
  beds: number;
  units?: number;
  availableUnits?: number;
  price: number;
};

export type BackendProperty = {
  id: string;
  ownerName?: string;
  name: string;
  description: string;
  city: string;
  area: string;
  university: string;
  distance: string;
  photos: string[];
  videos?: string[];
  amenities: string[];
  rooms: BackendPropertyRoom[];
  status: "draft" | "under_review" | "verified" | "changes_requested";
  createdAt: string;
};

export type AdminMetrics = {
  users: number;
  properties: number;
  pendingVerification: number;
  applications: number;
  bookings: number;
  supportTickets: number;
};

export type AdminUser = AuthUser;

export type AdminBooking = OwnerBooking;
export type AdminDispute = { id: string; name: string; email: string; topic: string; message: string; status: string; createdAt: string };
export type AdminReports = { usersByRole: Record<string, number>; propertiesByStatus: Record<string, number>; bookingsByStatus: Record<string, number>; totalBookingValue: number };

export async function getAdminBookings(token: string): Promise<AdminBooking[]> {
  const response = await request<{ data: AdminBooking[] }>("/admin/bookings", { headers: { authorization: `Bearer ${token}` } });
  return response.data;
}
export async function getAdminDisputes(token: string): Promise<AdminDispute[]> {
  const response = await request<{ data: AdminDispute[] }>("/admin/disputes", { headers: { authorization: `Bearer ${token}` } });
  return response.data;
}
export async function getAdminReports(token: string): Promise<AdminReports> {
  const response = await request<{ data: AdminReports }>("/admin/reports", { headers: { authorization: `Bearer ${token}` } });
  return response.data;
}

export async function updateAdminUserStatus(id: string, status: "active" | "suspended", token: string): Promise<AdminUser> {
  const response = await request<{ data: AdminUser }>(`/admin/users/${id}/status`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  return response.data;
}

export async function deleteAdminUser(id: string, token: string): Promise<void> {
  await request(`/admin/users/${id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
}

export async function getAdminOverview(token: string): Promise<AdminMetrics> {
  const response = await request<{ data: { metrics: AdminMetrics } }>("/admin/overview", { headers: { authorization: `Bearer ${token}` } });
  return response.data.metrics;
}

export async function getAdminProperties(token: string): Promise<BackendProperty[]> {
  const response = await request<{ data: BackendProperty[] }>("/admin/properties", { headers: { authorization: `Bearer ${token}` } });
  return response.data;
}

export async function getAdminUsers(token: string): Promise<AdminUser[]> {
  const response = await request<{ data: AdminUser[] }>("/admin/users", { headers: { authorization: `Bearer ${token}` } });
  return response.data;
}

export async function getAdminVerification(token: string): Promise<BackendProperty[]> {
  const response = await request<{ data: BackendProperty[] }>("/admin/verification", { headers: { authorization: `Bearer ${token}` } });
  return response.data;
}

export async function reviewProperty(id: string, status: "verified" | "changes_requested", token: string): Promise<BackendProperty> {
  const response = await request<{ data: BackendProperty }>(`/properties/${id}/review`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  return response.data;
}

export type HostelSearchFilters = {
  university?: string;
  location?: string;
  room?: string;
  verified?: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  let body = {} as T & ApiError;
  if (contentType.includes("application/json")) {
    body = (await response.json()) as T & ApiError;
  } else {
    await response.text();
    if (response.ok) {
      throw new Error("The configured backend URL returned a web page instead of an API response.");
    }
  }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.dispatchEvent(new Event(SESSION_EVENT));
    }
    throw new Error(
      body.error?.message ??
        (response.status === 404
          ? "This API route is not available on the running backend. Restart the backend server."
          : response.status === 401
            ? "Your session has expired. Please sign in again."
            : "The request could not be completed."),
    );
  }
  return body as T;
}

export async function searchHostels(
  filters: HostelSearchFilters,
): Promise<BackendProperty[]> {
  const query = new URLSearchParams();
  if (filters.university) query.set("university", filters.university);
  if (filters.location) query.set("location", filters.location);
  if (filters.room && filters.room !== "Any room type")
    query.set("room", filters.room);
  if (filters.verified !== undefined)
    query.set("verified", String(filters.verified));

  const response = await request<{ data: BackendProperty[] }>(
    `/hostels?${query.toString()}`,
  );
  if (!Array.isArray(response.data)) {
    throw new Error("The backend returned an invalid hostel list.");
  }
  return response.data;
}

export async function getHostel(id: string): Promise<BackendProperty> {
  const response = await request<{ data: BackendProperty }>(`/hostels/${id}`);
  return response.data;
}

export async function createProperty(
  input: {
    name: string;
    description: string;
    city: string;
    area: string;
    university: string;
    distance: string;
    photos: string[];
    videos?: string[];
    amenities: string[];
    rooms: Array<{ name: string; beds: number; units: number; price: number }>;
  },
  token: string,
): Promise<BackendProperty> {
  const response = await request<{ data: BackendProperty }>("/properties", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function getOwnerProperties(token: string): Promise<BackendProperty[]> {
  const response = await request<{ data: BackendProperty[] }>("/properties/mine", {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updateProperty(
  id: string,
  input: Parameters<typeof createProperty>[0],
  token: string,
): Promise<BackendProperty> {
  const response = await request<{ data: BackendProperty }>(`/properties/${id}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteProperty(id: string, token: string): Promise<void> {
  await request<void>(`/properties/${id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
}

export async function createApplication(
  input: {
    propertyId: string;
    roomName: string;
    moveInDate: string;
    details: Record<string, string>;
    documents: string[];
  },
  token: string,
) {
  const response = await request<{
    data: {
      id: string;
      propertyId: string;
      roomName: string;
      moveInDate: string;
      status: string;
      createdAt: string;
    };
  }>("/applications", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return response.data;
}

export type StudentApplication = {
  id: string;
  propertyId: string;
  roomName: string;
  moveInDate: string;
  details: Record<string, string>;
  documents: string[];
  status: string;
  reviewNote?: string;
  createdAt: string;
};

export type ReceivedApplication = {
  id: string;
  propertyId: string;
  roomName: string;
  moveInDate: string;
  details: Record<string, string>;
  documents: string[];
  status: string;
  reviewNote?: string;
  createdAt: string;
};

export async function getMyApplications(token: string): Promise<StudentApplication[]> {
  const response = await request<{ data: StudentApplication[] }>("/applications/mine", {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getReceivedApplications(token: string): Promise<ReceivedApplication[]> {
  const response = await request<{ data: ReceivedApplication[] }>('/applications/received', {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getMyBookings(token: string) {
  const response = await request<{ data: Array<{ id: string; propertyId: string; roomName: string; moveInDate: string; amount: number; status: string; createdAt: string }> }>("/bookings/mine", {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
}

export type OwnerBooking = {
  id: string;
  propertyId: string;
  propertyName: string;
  roomName: string;
  moveInDate: string;
  amount: number;
  status: string;
  studentName: string;
  studentEmail: string;
  createdAt: string;
};

export async function getOwnerBookings(token: string): Promise<OwnerBooking[]> {
  const response = await request<{ data: OwnerBooking[] }>("/owner/bookings", {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updateOwnerBookingStatus(id: string, status: "requested" | "confirmed" | "cancelled", token: string): Promise<void> {
  await request(`/owner/bookings/${id}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export type OwnerReview = {
  id: string;
  bookingId: string;
  propertyId: string;
  propertyName: string;
  roomName: string;
  studentName: string;
  rating: number;
  body: string;
  ownerReply?: string;
  createdAt: string;
};

export async function getOwnerReviews(token: string): Promise<OwnerReview[]> {
  const response = await request<{ data: OwnerReview[] }>("/owner/reviews", {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function replyToReview(id: string, ownerReply: string, token: string): Promise<void> {
  await request(`/owner/reviews/${id}/reply`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ ownerReply }),
  });
}

export async function createBooking(
  input: { propertyId: string; roomName: string; moveInDate: string },
  token: string,
) {
  const response = await request<{
    data: {
      id: string;
      propertyId: string;
      roomName: string;
      moveInDate: string;
      amount: number;
      status: string;
      createdAt: string;
    };
  }>("/bookings", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function createReview(input: { bookingId: string; rating: number; body: string }, token: string): Promise<void> {
  await request("/reviews", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
}

export async function createMaintenance(
  input: { subject: string; description: string; propertyId?: string },
  token: string,
) {
  const response = await request<{
    data: { id: string; status: string; createdAt: string };
  }>("/maintenance", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function createSupportTicket(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
}) {
  const response = await request<{
    data: { id: string; status: string; createdAt: string };
  }>("/support/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function getMyMessages(token: string) {
  const response = await request<{
    data: DirectMessage[];
  }>("/messages/mine", {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
}

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
};

export type MessageContact = {
  id: string;
  name: string;
  email: string;
  role: "student" | "owner" | "university" | "admin";
};

export async function getMessageContacts(token: string): Promise<MessageContact[]> {
  const response = await request<{ data: MessageContact[] }>("/messages/contacts", {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function sendMessage(input: { recipientId: string; body: string }, token: string): Promise<DirectMessage> {
  const response = await request<{ data: DirectMessage }>("/messages", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return response.data;
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
  schoolName?: string;
  phoneNumber?: string;
  gender?: "female" | "male" | "non_binary" | "prefer_not_to_say";
  ownerType?: "personal" | "company";
  companyAddress?: string;
  role: "student" | "owner" | "university" | "admin" | "superadmin";
  status: "active" | "suspended";
  mustChangePassword?: boolean;
  createdAt: string;
};

export async function createAdminAccount(input: { name: string; email: string; password: string }, token: string): Promise<AuthUser> {
  const response = await request<{ data: AuthUser }>("/admin/users", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return response.data;
}

export type AuthResponse = {
  user: AuthUser;
  token: string;
  expiresAt: number;
};

const SESSION_STORAGE_KEY = "arc.session";
const SESSION_EVENT = "arc:session";

function profilePhotoKey(userId: string): string {
  return `arc.profile.${userId}`;
}

export async function login(input: {
  email: string;
  password: string;
  role?: AuthUser["role"];
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginWithGoogle(input: {
  credential: string;
  role?: AuthUser["role"];
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await request<{ message: string }>("/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await request<{ message: string }>("/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function changePassword(password: string, token: string): Promise<AuthUser> {
  const response = await request<{ user: AuthUser }>("/auth/password", {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
  return response.user;
}

export async function signup(input: {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: "student" | "owner";
  schoolName?: string;
  phoneNumber?: string;
  gender?: AuthUser["gender"];
  ownerType?: "personal" | "company";
  companyAddress?: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getStoredSession(): AuthResponse | null {
  try {
    const session = JSON.parse(
      window.localStorage.getItem(SESSION_STORAGE_KEY) ?? "null",
    ) as AuthResponse | null;
    if (!session?.token || !session.user || session.expiresAt <= Date.now())
      return null;
    return session;
  } catch {
    return null;
  }
}

export function storeSession(session: AuthResponse): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export async function logout(): Promise<void> {
  const token = getStoredSessionToken();
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));

  if (!token) return;

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
  } catch {
    // The local session is already cleared if the API is unavailable.
  }
}

export function getSessionEventName(): string {
  return SESSION_EVENT;
}

export function getStoredSessionToken(): string | null {
  return getStoredSession()?.token ?? null;
}

export async function updateProfilePhoto(
  profilePhotoUrl: string,
  token: string,
): Promise<AuthUser> {
  const response = await request<{ user: AuthUser }>("/me/profile-photo", {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ profilePhotoUrl }),
  });
  return response.user;
}

export function getStoredProfilePhoto(userId: string): string {
  try {
    return (
      (
        JSON.parse(
          window.localStorage.getItem(profilePhotoKey(userId)) ?? "null",
        ) as { photoUrl?: string } | null
      )?.photoUrl ?? ""
    );
  } catch {
    return "";
  }
}

export function getProfilePhoto(user: AuthUser): string {
  return user.profilePhotoUrl || getStoredProfilePhoto(user.id);
}

export function getProfileInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "U";
}

export function storeProfilePhoto(userId: string, photoUrl: string): void {
  window.localStorage.setItem(
    profilePhotoKey(userId),
    JSON.stringify({ photoUrl }),
  );
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export type CloudinaryUploadSignature = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
};

async function prepareImageForUpload(file: File): Promise<File> {
  const maxBytes = 9 * 1024 * 1024;
  if (file.size <= maxBytes || typeof window === "undefined") return file;

  const bitmap = await createImageBitmap(file);
  const maxDimension = 2400;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = 0.82;
  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
  }
  if (!blob) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function uploadImageToCloudinary(
  file: File,
  token: string,
  kind: "property" | "profile" = "property",
): Promise<string> {
  const uploadFile = await prepareImageForUpload(file);
  const signatureResponse = await request<{ data: CloudinaryUploadSignature }>(
    "/uploads/signature",
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind }),
    },
  );
  const { data: signature } = signatureResponse;
  const form = new FormData();
  form.append("file", uploadFile);
  form.append("api_key", signature.apiKey);
  form.append("timestamp", String(signature.timestamp));
  form.append("signature", signature.signature);
  form.append("folder", signature.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    },
  );
  const body = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !body.secure_url)
    throw new Error(body.error?.message ?? "The image could not be uploaded.");
  return body.secure_url;
}

export async function uploadVideoToCloudinary(
  file: File,
  token: string,
): Promise<string> {
  if (!file.type.startsWith("video/"))
    throw new Error("Choose a supported video file.");
  const signatureResponse = await request<{ data: CloudinaryUploadSignature }>(
    "/uploads/signature",
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind: "property" }),
    },
  );
  const { data: signature } = signatureResponse;
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.apiKey);
  form.append("timestamp", String(signature.timestamp));
  form.append("signature", signature.signature);
  form.append("folder", signature.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`,
    { method: "POST", body: form },
  );
  const body = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !body.secure_url)
    throw new Error(body.error?.message ?? "The video could not be uploaded.");
  return body.secure_url;
}

export async function uploadDocumentToCloudinary(
  file: File,
  token: string,
): Promise<string> {
  const signatureResponse = await request<{ data: CloudinaryUploadSignature }>(
    "/uploads/signature",
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind: "documents" }),
    },
  );
  const { data: signature } = signatureResponse;
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.apiKey);
  form.append("timestamp", String(signature.timestamp));
  form.append("signature", signature.signature);
  form.append("folder", signature.folder);

  const resourceType = file.type === "application/pdf" ? "raw" : "image";
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`,
    { method: "POST", body: form },
  );
  const body = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !body.secure_url)
    throw new Error(body.error?.message ?? "The document could not be uploaded.");
  return body.secure_url;
}
