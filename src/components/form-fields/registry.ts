"use client";

import type { ComponentType } from "react";
import type { FieldType } from "@/lib/types";
import type { FieldProps } from "./types";
import { TextField } from "./TextField";
import { TextareaField } from "./TextareaField";
import { SelectField } from "./SelectField";
import { RadioField } from "./RadioField";
import { CheckboxField } from "./CheckboxField";
import { DateField } from "./DateField";
import { FileField } from "./FileField";
import { RatingField } from "./RatingField";
import { ScaleField } from "./ScaleField";
import { UnsupportedField } from "./UnsupportedField";

type Registry = Record<FieldType, ComponentType<FieldProps>>;

const fieldRegistry: Registry = {
  text: TextField,
  email: TextField,
  number: TextField,
  textarea: TextareaField,
  select: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  date: DateField,
  file: FileField,
  rating: RatingField,
  scale: ScaleField,
};

export function getFieldComponent(type: string): ComponentType<FieldProps> {
  return fieldRegistry[type as FieldType] ?? UnsupportedField;
}

