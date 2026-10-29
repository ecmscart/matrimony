"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { signup, setAuth, ApiRequestError } from "@/lib/api";

function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function maxAdultDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

const signupSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .regex(
        /^[6-9]\d{9}$/,
        "Enter a 10-digit Indian mobile number starting with 6-9",
      ),
    gender: z.enum(["Male", "Female"], {
      message: "Please select your gender",
    }),
    dateOfBirth: z.string().min(1, "Please enter your date of birth"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => ageFromDob(data.dateOfBirth) >= 18, {
    message: "You must be at least 18 years old",
    path: ["dateOfBirth"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const FIELD_ORDER: (keyof SignupFormData)[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "gender",
  "dateOfBirth",
  "password",
  "confirmPassword",
];

const ERROR_TEXT = "text-red-500 text-[1.05rem] mt-1 leading-snug";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={ERROR_TEXT}>{message}</p>;
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
    setFocus,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onSubmit",
  });

  useEffect(() => {
    const keys = Object.keys(errors) as (keyof SignupFormData)[];
    if (keys.length === 0) return;

    const step1Fields: (keyof SignupFormData)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
    ];
    const hasStep1Error = keys.some((k) => step1Fields.includes(k));
    if (hasStep1Error && step === 2) {
      setStep(1);
    }

    const first = FIELD_ORDER.find((k) => errors[k]);
    if (first) {
      setTimeout(() => {
        try {
          setFocus(first);
        } catch {
          // radio inputs may not support focus via setFocus
        }
        const el = document.getElementById(
          first === "dateOfBirth"
            ? "dob"
            : first === "email"
              ? "signup-email"
              : first === "password"
                ? "signup-password"
                : first,
        );
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }

    const firstMsg = first ? errors[first]?.message : undefined;
    if (firstMsg) {
      toast.error(String(firstMsg));
    }
  }, [errors, setFocus, step]);

  const onSubmit = async (data: SignupFormData) => {
    setFormError(null);
    try {
      const res = await signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        password: data.password,
      });
      setAuth(res);
      toast.success("Account created successfully.");
      router.push("/my-profile");
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Signup failed";
      setFormError(msg);
      toast.error(msg);
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const onInvalid = () => {
    setFormError("Please fix the highlighted fields and try again.");
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNextStep = async () => {
    const valid = await trigger(["firstName", "lastName", "email", "phone"]);
    if (valid) {
      setFormError(null);
      setStep(2);
      return;
    }
    setFormError("Please fix the highlighted fields and try again.");
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen px-4 py-12 md:flex md:items-center md:justify-center md:py-16">
      <div className="mx-auto w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Heart className="w-10 h-10 text-primary fill-primary" />
            <span className="text-2xl font-semibold text-[#2e263b]">
              Maher <span className="text-primary">Marriage Bureau</span>
            </span>
          </Link>
          <h1 className="headline-serif mt-6 text-3xl font-semibold text-[#241d30]">
            Create Your Account
          </h1>
          <p className="mt-2 text-[#655d72]">
            Join millions in finding their perfect life partner
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6 max-w-xs mx-auto">
          <div
            className={`flex-1 h-2 rounded-full ${
              step >= 1 ? "gradient-primary" : "bg-gray-200"
            }`}
          />
          <div
            className={`flex-1 h-2 rounded-full ${
              step >= 2 ? "gradient-primary" : "bg-gray-200"
            }`}
          />
        </div>

        <div ref={formTopRef} className="glass-panel rounded-3xl p-8">
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-5"
            noValidate
          >
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[1.05rem]">
                {formError}
              </div>
            )}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register("firstName")}
                        type="text"
                        id="firstName"
                        placeholder="First name"
                        className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white py-3 pl-10 pr-4"
                      />
                    </div>
                    <FieldError message={errors.firstName?.message} />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name
                    </label>
                    <input
                      {...register("lastName")}
                      type="text"
                      id="lastName"
                      placeholder="Last name"
                      className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3"
                    />
                    <FieldError message={errors.lastName?.message} />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register("email")}
                      type="email"
                      id="signup-email"
                      placeholder="you@example.com"
                      className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white py-3 pl-10 pr-4"
                    />
                  </div>
                  <FieldError message={errors.email?.message} />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register("phone")}
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      id="phone"
                      placeholder="9876543210"
                      onChange={(e) => {
                        e.target.value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        void register("phone").onChange(e);
                      }}
                      className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white py-3 pl-10 pr-4"
                    />
                  </div>
                  <FieldError message={errors.phone?.message} />
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full rounded-xl gradient-primary py-3 font-semibold text-white"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        {...register("gender")}
                        type="radio"
                        value="Male"
                        className="peer sr-only"
                      />
                      <div className="text-center py-3 border-2 border-gray-200 rounded-xl peer-checked:border-primary peer-checked:bg-rose-50 peer-checked:text-primary font-medium transition-all">
                        Male
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input
                        {...register("gender")}
                        type="radio"
                        value="Female"
                        className="peer sr-only"
                      />
                      <div className="text-center py-3 border-2 border-gray-200 rounded-xl peer-checked:border-primary peer-checked:bg-rose-50 peer-checked:text-primary font-medium transition-all">
                        Female
                      </div>
                    </label>
                  </div>
                  <FieldError message={errors.gender?.message} />
                </div>

                <div>
                  <label
                    htmlFor="dob"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register("dateOfBirth")}
                      type="date"
                      id="dob"
                      max={maxAdultDob()}
                      className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white py-3 pl-10 pr-4"
                    />
                  </div>
                  <FieldError message={errors.dateOfBirth?.message} />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      id="signup-password"
                      placeholder="Create a strong password"
                      className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white py-3 pl-10 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <FieldError message={errors.password?.message} />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register("confirmPassword")}
                      type="password"
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white py-3 pl-10 pr-4"
                    />
                  </div>
                  <FieldError message={errors.confirmPassword?.message} />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-[#efdfce] py-3 font-semibold text-[#544b62] transition-colors hover:bg-[#fff4ea]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl gradient-primary py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending code…" : "Verify Email"}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-[#60586f]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
