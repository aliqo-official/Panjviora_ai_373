
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";

type Institution = {
  id: string;
  institution_name: string;
  institution_type: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
  country: string;
  province: string | null;
  city: string;
  address: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  verification_status: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

type Campus = {
  id: string;
  institution_id: string;
  campus_name: string;
  city: string;
  province: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active?: boolean;
};

type Program = {
  id: string;
  institution_id: string;
  campus_id: string | null;
  program_type: "school_class" | "course" | "degree";
  program_name: string;
  description: string | null;
  eligibility: string | null;
  fee_min: number | null;
  fee_max: number | null;
  duration: string | null;
  admission_open: boolean;
  is_active: boolean;
  created_at: string;
};

type ProgramDraft = {
  campus_id: string;
  program_type: "school_class" | "course" | "degree";
  program_name: string;
  description: string;
  eligibility: string;
  fee_min: string;
  fee_max: string;
  duration: string;
  admission_open: boolean;
};

const EMPTY_PROGRAM: ProgramDraft = {
  campus_id: "",
  program_type: "course",
  program_name: "",
  description: "",
  eligibility: "",
  fee_min: "",
  fee_max: "",
  duration: "",
  admission_open: false,
};

type ProfileDraft = {
  institution_name: string;
  institution_type: string;
  description: string;
  phone: string;
  whatsapp_number: string;
  website_url: string;
  country: string;
  province: string;
  city: string;
  address: string;
  logo_url: string;
  cover_image_url: string;
