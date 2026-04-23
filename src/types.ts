export interface User {
  id: number;
  name: string;
  email: string;
  profile_pic?: string;
  cover_photo?: string;
  bio?: string;
  created_at?: string;
}

export interface Post {
  id: number;
  user_id: number;
  name: string;
  profile_pic?: string;
  content?: string;
  image?: string;
  video?: string;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  name: string;
  profile_pic?: string;
  comment: string;
  created_at: string;
}

export interface Message {
  id?: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  timestamp?: string;
}
