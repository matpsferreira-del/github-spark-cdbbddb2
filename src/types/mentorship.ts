export type MentorshipPlan = {
  id: string;
  user_id: string;
  mentee_name: string;
  current_position: string;
  current_area: string;
  current_situation: "employed" | "unemployed";
  state: string;
  city: string;
  region_preference: "same_region" | "open_to_change";
  available_cities: Array<{ state: string; city: string }>;
  work_model: "presencial" | "hibrido" | "remoto";
  wants_career_change: boolean;
  target_positions: string[];
  general_notes: string | null;
  linkedin_goals: {
    connectionsPerDay: number;
    postsPerWeek: number;
    connectionTypes: string[];
  };
  status: "draft" | "completed" | "archived";
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  plan_id: string;
  name: string;
  segment: string;
  tier: "A" | "B" | "C";
  has_openings: boolean;
  relevance_score: number;
  notes: string | null;
  kanban_stage: "identified" | "connection_sent" | "connected" | "message_sent" | "replied";
  created_at: string;
  updated_at: string;
};

export type JobTitleVariation = {
  id: string;
  plan_id: string;
  title: string;
  type: "current_variation" | "target_position";
  is_ai_generated: boolean;
  created_at: string;
};

export type MessageTemplate = {
  id: string;
  plan_id: string;
  type: "hr" | "decision_maker";
  template: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactMapping = {
  id: string;
  plan_id: string;
  name: string;
  current_position: string | null;
  company: string | null;
  linkedin_url: string | null;
  type: "decision_maker" | "hr" | "other";
  tier: "A" | "B" | "C";
  status: "identified" | "connection_sent" | "connected" | "message_sent" | "replied" | "meeting_scheduled";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleActivity = {
  id: string;
  plan_id: string;
  week_number: number;
  day_of_week: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  activity: string;
  category: "linkedin" | "networking" | "content" | "research" | "applications";
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type PlanAccessToken = {
  id: string;
  plan_id: string;
  token: string;
  mentee_name: string | null;
  expires_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
  access_count: number;
  is_active: boolean;
};

export type CvDocument = {
  id: string;
  plan_id: string;
  type: "linkedin_pdf" | "personal_cv";
  file_name: string;
  file_url: string;
  extracted_text: string | null;
  uploaded_at: string;
};
