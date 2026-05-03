"use client";

import TextField, { type TextFieldProps } from "@mui/material/TextField";

type Props = TextFieldProps;

/**
 * Thin wrapper over MUI TextField that enforces consistent sizing/spacing across forms.
 * Add error/helper text or other props as needed — they pass through.
 */
export default function FormField(props: Props) {
  return <TextField fullWidth size="small" {...props} />;
}
