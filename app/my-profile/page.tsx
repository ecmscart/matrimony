'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  ApiRequestError,
  deleteProfileImage,
  ensureFreshSession,
  getMyProfile,
  getMyProfileCompletion,
  getMyProfileImages,
  getStoredUser,
  imgUrl,
  lookupPincode,
  putMyProfile,
  searchUniversities,
  setPrimaryProfileImage,
  uploadProfileImages
} from '@/lib/api';
import type {
  Child,
  CreateProfileInput,
  FamilyType,
  MaritalStatus,
  Profile,
  ProfileCompletion,
  ProfileImage
} from '@/lib/types';
import {
  COMPLEXION_OPTIONS,
  CASTE_OPTIONS,
  CASTE_PREFERENCE_OPTIONS,
  EDUCATION_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  FATHER_TITLE_OPTIONS,
  HEIGHT_OPTIONS,
  INCOME_OPTIONS,
  INDIA_STATE_OPTIONS,
  LANGUAGE_OPTIONS,
  MARRIAGE_PREFERENCE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MOTHER_TITLE_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  OCCUPATION_OPTIONS,
  RELIGION_OPTIONS,
  SIBLING_AGE_RELATION_OPTIONS,
  SIBLING_MARITAL_STATUS_OPTIONS,
  SIBLING_RELATION_OPTIONS,
  formatParentName,
  isLateTitle,
  isPastMarriageStatus,
  isValidFamilyTypeValue,
  parseParentName,
  sanitizeCityText,
  sanitizeFamilyTypeOther,
  type FieldOption
} from '@/lib/constants/profile-options';
import { AutocompleteInput } from '@/components/AutocompleteInput';
import { MultiSelectDropdown } from '@/components/MultiSelectDropdown';
import { PhotoCropModal } from '@/components/PhotoCropModal';

const BUREAU_CONTACT = '+91 98115 99425, +91 98119 90161';
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PROFILE_DRAFT_KEY = 'mmb_profile_form_draft';

type ProfileDraft = {
  form: CreateProfileInput;
  fatherTitle: string;
  fatherNameOnly: string;
  motherTitle: string;
  motherNameOnly: string;
  interestsText: string;
  pincode: string;
  savedAt: number;
};

function readProfileDraft(userId: string): ProfileDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${PROFILE_DRAFT_KEY}:${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ProfileDraft;
  } catch {
    return null;
  }
}

function writeProfileDraft(userId: string, draft: ProfileDraft) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${PROFILE_DRAFT_KEY}:${userId}`,
      JSON.stringify(draft)
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function clearProfileDraft(userId: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(`${PROFILE_DRAFT_KEY}:${userId}`);
}

const EMPTY_FORM: CreateProfileInput = {
  height: '',
  city: '',
  state: '',
  religion: '',
  caste: '',
  motherTongue: '',
  familyType: 'Nuclear',
  maritalStatus: 'Never_Married',
  education: '',
  educationUniversity: '',
  occupation: '',
  income: '',
  about: '',
  interests: [],
  complexion: '',
  homeTown: '',
  educationCity: '',
  castePreference: '',
  marriagePreference: '',
  languagesKnown: [],
  currentAddress: '',
  addressCity: '',
  addressArea: '',
  motherPhone: '',
  fatherPhone: '',
  otherPhone: '',
  coordinatorNumber: '',
  fatherName: '',
  fatherOccupation: '',
  motherName: '',
  motherOccupation: '',
  totalSiblings: '',
  brotherEducation: '',
  sisterEducation: '',
  siblings: [],
  hasChildren: null,
  children: [],
  otherDetails: ''
};

// Maps a saved profile from the API back into the editable form shape so every
// field the member has already filled in the database is pre-populated. Empty
// values fall back to the blank defaults, and `maritalStatus` is converted from
// the API's spaced form ("Never Married") to the option value ("Never_Married").
function mapProfileToForm(profile: Profile): CreateProfileInput {
  return {
    ...EMPTY_FORM,
    height: profile.height ?? '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    religion: profile.religion ?? '',
    caste: profile.caste ?? '',
    motherTongue: profile.motherTongue ?? '',
    familyType: (profile.familyType as FamilyType) || 'Nuclear',
    maritalStatus:
      ((profile.maritalStatus ?? '').replace(/ /g, '_') as MaritalStatus) ||
      'Never_Married',
    education: profile.education ?? '',
    educationUniversity: profile.educationUniversity ?? '',
    occupation: profile.occupation ?? '',
    income: profile.income ?? '',
    about: profile.about ?? '',
    interests: profile.interests ?? [],
    complexion: profile.complexion ?? '',
    homeTown: profile.homeTown ?? '',
    educationCity: profile.educationCity ?? '',
    castePreference: profile.castePreference ?? '',
    marriagePreference: profile.marriagePreference ?? '',
    languagesKnown: profile.languagesKnown ?? [],
    currentAddress: profile.currentAddress ?? '',
    addressCity: profile.addressCity ?? '',
    addressArea: profile.addressArea ?? '',
    motherPhone: profile.motherPhone ?? '',
    fatherPhone: profile.fatherPhone ?? '',
    otherPhone: profile.otherPhone ?? '',
    coordinatorNumber: profile.coordinatorNumber ?? '',
    fatherName: profile.fatherName ?? '',
    fatherOccupation: profile.fatherOccupation ?? '',
    motherName: profile.motherName ?? '',
    motherOccupation: profile.motherOccupation ?? '',
    totalSiblings: profile.totalSiblings ?? '',
    brotherEducation: profile.brotherEducation ?? '',
    sisterEducation: profile.sisterEducation ?? '',
    siblings: (profile.siblings ?? []).map((s) => ({
      name: s.name ?? '',
      relation: s.relation ?? '',
      ageRelation: s.ageRelation ?? '',
      maritalStatus: s.maritalStatus ?? '',
      education: s.education ?? '',
      profession: s.profession ?? ''
    })),
    hasChildren:
      typeof profile.hasChildren === 'boolean' ? profile.hasChildren : null,
    children: (profile.children ?? []).map((c) => ({
      age: c.age ?? '',
      gender: c.gender ?? '',
      stayingWithYou: Boolean(c.stayingWithYou)
    })),
    otherDetails: profile.otherDetails ?? ''
  };
}

export default function MyProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateProfileInput>(EMPTY_FORM);
  const [fatherTitle, setFatherTitle] = useState('Mr.');
  const [fatherNameOnly, setFatherNameOnly] = useState('');
  const [motherTitle, setMotherTitle] = useState('Mrs.');
  const [motherNameOnly, setMotherNameOnly] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [photos, setPhotos] = useState<ProfileImage[]>([]);
  /** Cropped photos waiting to upload — used on first create before the profile exists. */
  const [pendingPhotos, setPendingPhotos] = useState<
    { id: string; file: File; previewUrl: string }[]
  >([]);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showThanksModal, setShowThanksModal] = useState(false);
  const [pincode, setPincode] = useState('');
  const [areaOptions, setAreaOptions] = useState<string[]>([]);
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [croppedBatch, setCroppedBatch] = useState<File[]>([]);
  const [allowDraftSave, setAllowDraftSave] = useState(false);
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);

  const user = useMemo(() => getStoredUser(), []);
  const fatherLate = isLateTitle(fatherTitle);
  const motherLate = isLateTitle(motherTitle);

  const applyDraft = (draft: ProfileDraft) => {
    setForm({ ...EMPTY_FORM, ...draft.form });
    setFatherTitle(draft.fatherTitle || 'Mr.');
    setFatherNameOnly(draft.fatherNameOnly || '');
    setMotherTitle(draft.motherTitle || 'Mrs.');
    setMotherNameOnly(draft.motherNameOnly || '');
    setInterestsText(draft.interestsText || '');
    setPincode(draft.pincode || '');
  };

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const draft = user?.id ? readProfileDraft(user.id) : null;
      // Unsaved local draft wins so a long fill session is never wiped if the
      // member reloads or the token briefly fails before save.
      if (draft?.form) {
        applyDraft(draft);
        setHasSavedProfile(false);
        try {
          const existing = await getMyProfile();
          setHasSavedProfile(Boolean(existing));
        } catch {
          // Keep draft visible even if profile fetch fails.
        }
        return;
      }

      const profile = await getMyProfile();
      if (profile) {
        setHasSavedProfile(true);
        const mapped = mapProfileToForm(profile);
        setForm(mapped);
        const father = parseParentName(profile.fatherName);
        const mother = parseParentName(profile.motherName);
        setFatherTitle(father.title || 'Mr.');
        setFatherNameOnly(father.name);
        setMotherTitle(mother.title || 'Mrs.');
        setMotherNameOnly(mother.name);
        setInterestsText((profile.interests ?? []).join(', '));
      } else {
        setHasSavedProfile(false);
      }
    } catch (err) {
      const draft = user?.id ? readProfileDraft(user.id) : null;
      if (draft?.form) {
        applyDraft(draft);
      }
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to load your saved profile'
      );
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadCompletion = async () => {
    setIsLoadingCompletion(true);
    try {
      const data = await getMyProfileCompletion();
      setCompletion(data);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to load profile completion'
      );
    } finally {
      setIsLoadingCompletion(false);
    }
  };

  const loadPhotos = async () => {
    const imgs = await getMyProfileImages();
    setPhotos(imgs);
  };

  useEffect(() => {
    void loadProfile();
    void loadCompletion();
    void loadPhotos();
  }, []);

  // Autosave in-progress form details so a long fill session is not lost.
  useEffect(() => {
    if (!user?.id || isLoadingProfile || !allowDraftSave) return;
    const timer = window.setTimeout(() => {
      writeProfileDraft(user.id, {
        form,
        fatherTitle,
        fatherNameOnly,
        motherTitle,
        motherNameOnly,
        interestsText,
        pincode,
        savedAt: Date.now()
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [
    user?.id,
    isLoadingProfile,
    allowDraftSave,
    form,
    fatherTitle,
    fatherNameOnly,
    motherTitle,
    motherNameOnly,
    interestsText,
    pincode
  ]);

  useEffect(() => {
    if (!showThanksModal) return;
    const timer = setTimeout(() => {
      setShowThanksModal(false);
      router.push('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [showThanksModal, router]);

  const updateField = <K extends keyof CreateProfileInput>(
    key: K,
    value: CreateProfileInput[K]
  ) => {
    setAllowDraftSave(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setSiblingCount = (count: number) => {
    setAllowDraftSave(true);
    setForm((prev) => {
      const current = prev.siblings ?? [];
      if (count > current.length) {
        return {
          ...prev,
          siblings: [
            ...current,
            ...Array.from({ length: count - current.length }, () => ({
              name: '',
              relation: '',
              ageRelation: '',
              maritalStatus: '',
              education: '',
              profession: ''
            }))
          ]
        };
      }
      return { ...prev, siblings: current.slice(0, count) };
    });
  };

  const updateSibling = (
    index: number,
    key:
      | 'name'
      | 'relation'
      | 'ageRelation'
      | 'maritalStatus'
      | 'education'
      | 'profession',
    value: string
  ) => {
    setAllowDraftSave(true);
    setForm((prev) => {
      const next = [...(prev.siblings ?? [])];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, siblings: next };
    });
  };

  const setMaritalStatus = (status: MaritalStatus) => {
    setAllowDraftSave(true);
    setForm((prev) => {
      if (!isPastMarriageStatus(status)) {
        return {
          ...prev,
          maritalStatus: status,
          hasChildren: null,
          children: []
        };
      }
      return { ...prev, maritalStatus: status };
    });
  };

  const setHasChildren = (hasChildren: boolean) => {
    setAllowDraftSave(true);
    setForm((prev) => ({
      ...prev,
      hasChildren,
      children: hasChildren
        ? prev.children && prev.children.length > 0
          ? prev.children
          : [{ age: '', gender: '', stayingWithYou: true }]
        : []
    }));
  };

  const addChild = () => {
    setAllowDraftSave(true);
    setForm((prev) => ({
      ...prev,
      children: [
        ...(prev.children ?? []),
        { age: '', gender: '', stayingWithYou: true }
      ]
    }));
  };

  const removeChild = (index: number) => {
    setAllowDraftSave(true);
    setForm((prev) => ({
      ...prev,
      children: (prev.children ?? []).filter((_, i) => i !== index)
    }));
  };

  const updateChild = (
    index: number,
    key: keyof Child,
    value: string | boolean
  ) => {
    setAllowDraftSave(true);
    setForm((prev) => {
      const children = [...(prev.children ?? [])];
      children[index] = { ...children[index], [key]: value };
      return { ...prev, children };
    });
  };

  const fetchUniversities = useCallback(
    (q: string) => searchUniversities(q).then((r) => r.universities),
    []
  );

  const onPincodeChange = async (raw: string) => {
    setAllowDraftSave(true);
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setPincode(digits);
    if (digits.length !== 6) {
      setAreaOptions([]);
      setPincodeStatus(null);
      return;
    }
    setPincodeStatus('Looking up PIN code...');
    try {
      const res = await lookupPincode(digits);
      if (!res.state && res.areas.length === 0) {
        setAreaOptions([]);
        setPincodeStatus('No match found for this PIN code.');
        return;
      }
      setForm((prev) => ({
        ...prev,
        state: res.state ?? prev.state,
        city: sanitizeCityText(prev.city || res.district || prev.city),
        addressCity: res.district ?? prev.addressCity
      }));
      setAreaOptions(res.areas);
      const location = [res.district, res.state].filter(Boolean).join(', ');
      setPincodeStatus(location ? `Found: ${location}` : 'Location found.');
    } catch {
      setAreaOptions([]);
      setPincodeStatus('Lookup failed. Please enter your address manually.');
    }
  };

  const clearPendingPhotos = (
    list: { id: string; file: File; previewUrl: string }[]
  ) => {
    for (const item of list) URL.revokeObjectURL(item.previewUrl);
  };

  const removePendingPhoto = (id: string) => {
    setPendingPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const uploadCroppedPhotos = async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);
    setSuccess(null);
    setIsUploadingPhotos(true);
    try {
      const res = await uploadProfileImages(files);
      setPhotos((prev) => [...prev, ...res.uploaded]);
      setSuccess('Photos uploaded successfully.');
      await loadCompletion();
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Failed to upload photos'
      );
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  /** After crop: upload immediately if profile exists; otherwise keep for first save. */
  const commitCroppedPhotos = async (files: File[]) => {
    if (files.length === 0) return;
    if (!hasSavedProfile) {
      setPendingPhotos((prev) => {
        const room = Math.max(0, 5 - photos.length - prev.length);
        const toAdd = files.slice(0, room).map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          previewUrl: URL.createObjectURL(file)
        }));
        return [...prev, ...toAdd];
      });
      setSuccess(
        'Photos ready. They will be uploaded when you save your profile.'
      );
      return;
    }
    await uploadCroppedPhotos(files);
  };

  const onSelectPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (picked.length === 0) return;

    const room = 5 - photos.length - pendingPhotos.length;
    if (room <= 0) {
      const msg = 'You can upload up to 5 photos.';
      setError(msg);
      toast.error(msg);
      return;
    }

    const files = picked.slice(0, room);
    if (picked.length > room) {
      toast.error(`Only ${room} more photo(s) can be added (max 5).`);
    }

    setError(null);
    setSuccess(null);
    setCroppedBatch([]);
    setCropQueue(files);
  };

  const onCropConfirm = async (cropped: File) => {
    const remaining = cropQueue.slice(1);
    const nextBatch = [...croppedBatch, cropped];
    setCroppedBatch(nextBatch);
    setCropQueue(remaining);
    if (remaining.length === 0) {
      setCroppedBatch([]);
      await commitCroppedPhotos(nextBatch);
    }
  };

  const onCropCancel = () => {
    setCropQueue([]);
    setCroppedBatch([]);
  };

  const onSetPrimaryPhoto = async (photoId: string) => {
    setError(null);
    try {
      await setPrimaryProfileImage(photoId);
      setPhotos((prev) =>
        prev.map((photo) => ({
          ...photo,
          isPrimary: photo.id === photoId
        }))
      );
      await loadCompletion();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Failed to set primary photo'
      );
    }
  };

  const onDeletePhoto = async (photoId: string) => {
    const target = photos.find((photo) => photo.id === photoId);
    if (!target) return;

    if (target.isPrimary) {
      const msg =
        'Cannot delete the primary photo. Set another photo as primary first.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (photos.length <= 1) {
      const msg =
        'At least one photo is required. Upload another photo before deleting this one.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setError(null);
    try {
      await deleteProfileImage(photoId);
      // Remove only the deleted id — never clear the whole list.
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      await loadCompletion();
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Failed to delete photo'
      );
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fail = (msg: string, fieldId?: string) => {
      setError(msg);
      toast.error(msg);
      if (fieldId) {
        document
          .getElementById(fieldId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    if (!form.height.trim()) return fail('Height is required.', 'field-height');
    if (!(form.complexion ?? '').trim())
      return fail('Complexion is required.', 'field-complexion');
    if (!sanitizeCityText(form.city).trim())
      return fail('City is required (letters only, max 20).', 'field-city');
    if (!form.state.trim()) return fail('State is required.', 'field-state');
    if (!sanitizeCityText(form.homeTown ?? '').trim())
      return fail(
        'Home Town is required (letters only, max 20).',
        'field-homeTown'
      );
    if (!form.religion.trim())
      return fail('Religion is required.', 'field-religion');
    if (!form.caste.trim()) return fail('Caste is required.', 'field-caste');
    if (!(form.castePreference ?? '').trim())
      return fail('Caste preference is required.', 'field-castePreference');
    if (!(form.marriagePreference ?? '').trim())
      return fail(
        'Marriage preference is required.',
        'field-marriagePreference'
      );
    if (!form.motherTongue.trim())
      return fail('Mother tongue is required.', 'field-motherTongue');
    if (!isValidFamilyTypeValue(form.familyType))
      return fail(
        'Family type is required. If Other, type letters only (max 40).',
        'field-familyType'
      );
    if (!form.maritalStatus)
      return fail('Marital status is required.', 'field-maritalStatus');
    if (!form.education.trim())
      return fail('Education is required.', 'field-education');
    if (!sanitizeCityText(form.educationCity ?? '').trim())
      return fail(
        'Education City is required (letters only, max 20).',
        'field-educationCity'
      );
    if (!form.occupation.trim())
      return fail('Occupation is required.', 'field-occupation');
    if (!form.income.trim()) return fail('Income is required.', 'field-income');
    if (!(form.addressCity ?? '').trim())
      return fail('Address City is required.', 'field-addressCity');
    if (!(form.currentAddress ?? '').trim())
      return fail('Current address is required.', 'field-currentAddress');

    if (!fatherTitle.trim())
      return fail("Please select Mr. or Lt. for father's name.", 'field-father');
    if (!fatherNameOnly.trim())
      return fail("Father's name is required.", 'field-father');
    if (!(form.fatherOccupation ?? '').trim())
      return fail("Father's occupation is required.", 'field-fatherOccupation');
    if (!fatherLate) {
      const fp = (form.fatherPhone ?? '').trim();
      if (!PHONE_REGEX.test(fp))
        return fail(
          "Father's phone is required (10-digit Indian mobile).",
          'field-fatherPhone'
        );
    }

    if (!motherTitle.trim())
      return fail(
        "Please select Mrs. or Lt. for mother's name.",
        'field-mother'
      );
    if (!motherNameOnly.trim())
      return fail("Mother's name is required.", 'field-mother');
    if (!(form.motherOccupation ?? '').trim())
      return fail("Mother's occupation is required.", 'field-motherOccupation');
    if (!motherLate) {
      const mp = (form.motherPhone ?? '').trim();
      if (!PHONE_REGEX.test(mp))
        return fail(
          "Mother's phone is required (10-digit Indian mobile).",
          'field-motherPhone'
        );
    }

    const parsedInterests = interestsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (parsedInterests.length === 0) {
      return fail('Please add at least one interest.', 'field-interests');
    }

    if (!(form.languagesKnown ?? []).length) {
      return fail('Please select at least one language.', 'field-languages');
    }

    const aboutTrimmed = form.about.trim();
    if (aboutTrimmed.length < 20) {
      return fail('About must be at least 20 characters.', 'field-about');
    }
    if (aboutTrimmed.length > 1000) {
      return fail('About must be 1000 characters or fewer.', 'field-about');
    }

    const coordinatorNumber = (form.coordinatorNumber ?? '').trim();
    if (!PHONE_REGEX.test(coordinatorNumber)) {
      return fail(
        'Coordinator number is required (10-digit Indian mobile).',
        'field-coordinator'
      );
    }

    const pastMarriage = isPastMarriageStatus(form.maritalStatus);
    if (pastMarriage && form.hasChildren == null) {
      return fail(
        'Please select whether you have children.',
        'field-hasChildren'
      );
    }
    if (pastMarriage && form.hasChildren === true) {
      const kids = form.children ?? [];
      if (kids.length === 0) {
        return fail('Please add at least one child.', 'field-children');
      }
      for (let i = 0; i < kids.length; i++) {
        const c = kids[i];
        if (!c.age.trim() || !c.gender) {
          return fail(
            `Please complete age and gender for child ${i + 1}.`,
            'field-children'
          );
        }
      }
    }

    if (photos.length === 0 && pendingPhotos.length === 0) {
      return fail('Please upload at least one photo.', 'field-photos');
    }

    if (!agreedToDisclaimer) {
      return fail(
        'Please confirm the disclaimer before saving your profile.',
        'field-disclaimer'
      );
    }

    const siblings = (form.siblings ?? []).map((s) => ({
      name: s.name.trim(),
      relation: (s.relation ?? '').trim(),
      ageRelation: (s.ageRelation ?? '').trim(),
      maritalStatus: (s.maritalStatus ?? '').trim(),
      education: s.education.trim(),
      profession: s.profession.trim()
    }));

    const children =
      pastMarriage && form.hasChildren === true
        ? (form.children ?? []).map((c) => ({
            age: String(c.age).trim(),
            gender: c.gender,
            stayingWithYou: Boolean(c.stayingWithYou)
          }))
        : [];

    const wasFirstSave = !hasSavedProfile;
    const photosToUpload = pendingPhotos;

    const payload: CreateProfileInput = {
      ...form,
      city: sanitizeCityText(form.city).trim(),
      homeTown: sanitizeCityText(form.homeTown ?? '').trim(),
      educationCity: sanitizeCityText(form.educationCity ?? '').trim(),
      fatherName: formatParentName(fatherTitle, fatherNameOnly),
      motherName: formatParentName(motherTitle, motherNameOnly),
      fatherPhone: fatherLate ? '' : (form.fatherPhone ?? '').trim(),
      motherPhone: motherLate ? '' : (form.motherPhone ?? '').trim(),
      about: aboutTrimmed,
      interests: parsedInterests,
      siblings,
      totalSiblings: siblings.length ? String(siblings.length) : '',
      hasChildren: pastMarriage ? Boolean(form.hasChildren) : null,
      children
    };

    setIsSaving(true);
    try {
      // Refresh tokens before save so a long fill session still submits cleanly.
      await ensureFreshSession();
      await putMyProfile(payload);
      setHasSavedProfile(true);
      setAllowDraftSave(false);
      if (user?.id) clearProfileDraft(user.id);

      let uploadedCount = photos.length;
      if (photosToUpload.length > 0) {
        setIsUploadingPhotos(true);
        try {
          const res = await uploadProfileImages(
            photosToUpload.map((p) => p.file)
          );
          setPhotos((prev) => [...prev, ...res.uploaded]);
          uploadedCount += res.uploaded.length;
          clearPendingPhotos(photosToUpload);
          setPendingPhotos([]);
        } catch (photoErr) {
          const photoMsg =
            photoErr instanceof ApiRequestError
              ? photoErr.message
              : 'Profile saved, but photo upload failed. Please try uploading again.';
          setError(photoMsg);
          toast.error(photoMsg);
          await loadCompletion();
          return;
        } finally {
          setIsUploadingPhotos(false);
        }
      }

      await loadCompletion();
      if (wasFirstSave) {
        setShowThanksModal(true);
        return;
      }
      if (uploadedCount === 0) {
        const msg =
          'Profile saved. Please upload at least one photo to complete your profile.';
        setSuccess(null);
        setError(msg);
        toast.error(msg);
        return;
      }
      setSuccess('Profile saved successfully.');
      toast.success('Profile saved successfully.');
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? (err.details?.[0]?.message ?? err.message)
          : 'Failed to save profile';
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className='section-shell py-16'>
        <div className='mx-auto max-w-xl rounded-3xl border border-[#f0dfcf] bg-white p-8 text-center'>
          <h1 className='headline-serif text-3xl text-[#2a2237]'>
            Login Required
          </h1>
          <p className='mt-3 text-[#6a6376]'>
            Please login to create or update your profile.
          </p>
          <Link
            href='/login'
            className='mt-6 inline-block rounded-full gradient-primary px-6 py-3 text-white font-medium'
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      <div className='section-shell pt-8 md:pt-10'>
        <div className='rounded-[2rem] border border-[#f0dfcf] bg-white/90 px-6 py-10 md:px-8'>
          <h1 className='headline-serif text-3xl font-semibold text-[#251e31] md:text-4xl'>
            Complete Your Profile
          </h1>
          <p className='mt-2 text-[#655e71]'>
            Fill all profile sections to improve your match quality and
            visibility.
          </p>
          <div className='mt-5 grid gap-3 md:grid-cols-3'>
            <div className='rounded-2xl border border-[#f0dfcf] bg-[#fff8f0] p-4'>
              <p className='text-xs uppercase tracking-wide text-[#8a8099]'>
                Profile ID
              </p>
              <p className='mt-1 font-semibold text-[#352d44]'>
                {completion?.profileNumber ||
                  completion?.profileId ||
                  'Not assigned'}
              </p>
            </div>
            <div className='rounded-2xl border border-[#f0dfcf] bg-[#fff8f0] p-4'>
              <p className='text-xs uppercase tracking-wide text-[#8a8099]'>
                Completion
              </p>
              <p className='mt-1 font-semibold text-[#352d44]'>
                {isLoadingCompletion
                  ? 'Loading...'
                  : `${completion?.overallPercentage ?? 0}%`}
              </p>
            </div>
            <div className='rounded-2xl border border-[#f0dfcf] bg-[#fff8f0] p-4'>
              <p className='text-xs uppercase tracking-wide text-[#8a8099]'>
                Status
              </p>
              <p className='mt-1 font-semibold text-[#352d44]'>
                {completion?.isPublished ? 'Published' : 'Not Published'} /{' '}
                {completion?.isVerified ? 'Verified' : 'Not Verified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='section-shell py-8 md:py-10'>
        {isLoadingProfile ? (
          <div className='rounded-[2rem] border border-[#f0dfcf] bg-white/90 px-6 py-16 text-center text-[#655e71]'>
            Loading your saved details...
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className='space-y-8'
          >
          {error && (
            <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[1.05rem] text-red-700'>
              {error}
            </div>
          )}
          {success && (
            <div className='rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[1.05rem] text-emerald-700'>
              {success}
            </div>
          )}

          <FormGroupHeading
            title='1. Self Information'
            subtitle='Your main personal, religious, and career details'
          />

          <Section title='Basic'>
            <Field label='Height *'>
              <select
                id='field-height'
                value={form.height}
                onChange={(e) => updateField('height', e.target.value)}
                required
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
              >
                <option value=''>Select height</option>
                {HEIGHT_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <div id='field-complexion'>
              <SelectWithOther
                label='Complexion *'
                value={form.complexion ?? ''}
                onChange={(v) => updateField('complexion', v)}
                options={COMPLEXION_OPTIONS}
                required
              />
            </div>
            <Field label='City *'>
              <input
                id='field-city'
                value={form.city}
                maxLength={20}
                onChange={(e) =>
                  updateField('city', sanitizeCityText(e.target.value))
                }
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                placeholder='Letters only, max 20'
                required
              />
            </Field>
            <div id='field-state'>
              <SelectWithOther
                label='State *'
                value={form.state}
                onChange={(v) => updateField('state', v)}
                options={INDIA_STATE_OPTIONS}
                required
                placeholder='Select state'
              />
            </div>
            <Field label='Home Town *'>
              <input
                id='field-homeTown'
                value={form.homeTown ?? ''}
                maxLength={20}
                onChange={(e) =>
                  updateField('homeTown', sanitizeCityText(e.target.value))
                }
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                placeholder='Letters only, max 20'
                required
              />
            </Field>
          </Section>

          <Section title='Religious & Family'>
            <div id='field-religion'>
              <SelectWithOther
                label='Religion *'
                value={form.religion}
                onChange={(v) => updateField('religion', v)}
                options={RELIGION_OPTIONS}
                required
              />
            </div>
            <div id='field-caste'>
              <SelectWithOther
                label='Caste *'
                value={form.caste}
                onChange={(v) => updateField('caste', v)}
                options={CASTE_OPTIONS}
                required
                placeholder='Select caste'
              />
            </div>
            <Field label='Marital Status *'>
              <select
                id='field-maritalStatus'
                value={form.maritalStatus}
                onChange={(e) =>
                  setMaritalStatus(e.target.value as MaritalStatus)
                }
                required
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
              >
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>

            {isPastMarriageStatus(form.maritalStatus) && (
              <>
                <Field label='Has children? *'>
                  <select
                    id='field-hasChildren'
                    value={
                      form.hasChildren === true
                        ? 'yes'
                        : form.hasChildren === false
                          ? 'no'
                          : ''
                    }
                    required
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'yes') setHasChildren(true);
                      else if (v === 'no') setHasChildren(false);
                    }}
                    className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                  >
                    <option value=''>Select</option>
                    <option value='yes'>Yes</option>
                    <option value='no'>No</option>
                  </select>
                </Field>

                {form.hasChildren === true && (
                  <div
                    id='field-children'
                    className='md:col-span-2 space-y-4'
                  >
                    {(form.children ?? []).map((child, index) => (
                      <div
                        key={index}
                        className='rounded-xl border border-[#efdfce] bg-[#fffaf5] p-4'
                      >
                        <div className='mb-3 flex items-center justify-between'>
                          <p className='text-sm font-semibold text-[#2e263b]'>
                            Child {index + 1}
                          </p>
                          {(form.children?.length ?? 0) > 1 && (
                            <button
                              type='button'
                              onClick={() => removeChild(index)}
                              className='text-xs font-medium text-red-600 hover:underline'
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className='grid gap-3 sm:grid-cols-3'>
                          <Field label='Age'>
                            <input
                              type='number'
                              min={0}
                              max={50}
                              required
                              value={child.age}
                              onChange={(e) =>
                                updateChild(index, 'age', e.target.value)
                              }
                              className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                              placeholder='Age'
                            />
                          </Field>
                          <Field label='Gender'>
                            <select
                              required
                              value={child.gender}
                              onChange={(e) =>
                                updateChild(index, 'gender', e.target.value)
                              }
                              className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                            >
                              <option value=''>Select</option>
                              <option value='Male'>Male</option>
                              <option value='Female'>Female</option>
                            </select>
                          </Field>
                          <Field label='Staying with you?'>
                            <select
                              required
                              value={child.stayingWithYou ? 'yes' : 'no'}
                              onChange={(e) =>
                                updateChild(
                                  index,
                                  'stayingWithYou',
                                  e.target.value === 'yes'
                                )
                              }
                              className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                            >
                              <option value='yes'>Yes</option>
                              <option value='no'>No</option>
                            </select>
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={addChild}
                      className='rounded-full border border-[#ebd8c4] px-4 py-2 text-sm font-medium text-[#4f455d] hover:bg-[#fff1e5]'
                    >
                      + Add more
                    </button>
                  </div>
                )}
              </>
            )}

            <div id='field-castePreference'>
              <CastePreferenceField
                value={form.castePreference ?? ''}
                onChange={(v) => updateField('castePreference', v)}
              />
            </div>

            <Field label="Marriage Preference (partner's marital status) *">
              <div id='field-marriagePreference'>
                <MultiSelectDropdown
                  options={MARRIAGE_PREFERENCE_OPTIONS}
                  value={
                    form.marriagePreference
                      ? form.marriagePreference
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : []
                  }
                  onChange={(vals) =>
                    updateField('marriagePreference', vals.join(', '))
                  }
                  placeholder='Select marriage preferences'
                />
              </div>
            </Field>
            <div id='field-motherTongue'>
              <SelectWithOther
                label='Mother Tongue *'
                value={form.motherTongue}
                onChange={(v) => updateField('motherTongue', v)}
                options={MOTHER_TONGUE_OPTIONS}
                required
              />
            </div>
            <div id='field-familyType'>
              <SelectWithOther
                label='Family Type *'
                value={form.familyType}
                onChange={(v) => updateField('familyType', v as FamilyType)}
                options={FAMILY_TYPE_OPTIONS}
                required
                maxLength={40}
                sanitize={sanitizeFamilyTypeOther}
              />
            </div>
          </Section>

          <Section title='Career'>
            <SelectWithOther
              label='Education *'
              value={form.education}
              onChange={(v) => updateField('education', v)}
              options={EDUCATION_OPTIONS}
              required
            />
            <Field label='University (last attended)'>
              <AutocompleteInput
                value={form.educationUniversity ?? ''}
                onChange={(v) => updateField('educationUniversity', v)}
                fetchOptions={fetchUniversities}
                placeholder='Start typing to search universities'
              />
            </Field>
            <Field label='Education City *'>
              <input
                id='field-educationCity'
                value={form.educationCity ?? ''}
                maxLength={20}
                onChange={(e) =>
                  updateField('educationCity', sanitizeCityText(e.target.value))
                }
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                placeholder='Letters only, max 20'
                required
              />
            </Field>
            <SelectWithOther
              label='Occupation *'
              value={form.occupation}
              onChange={(v) => updateField('occupation', v)}
              options={OCCUPATION_OPTIONS}
              required
            />
            <SelectWithOther
              label='Income *'
              value={form.income}
              onChange={(v) => updateField('income', v)}
              options={INCOME_OPTIONS}
              required
            />
          </Section>

          <FormGroupHeading
            title='2. Family & Address'
            subtitle='Where you live and family background'
          />

          <Section title='Address'>
            <Field label='PIN Code (auto-fills State, City & Area)'>
              <input
                value={pincode}
                inputMode='numeric'
                maxLength={6}
                onChange={(e) => onPincodeChange(e.target.value)}
                placeholder='e.g. 110001'
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
              />
              {pincodeStatus && (
                <p className='mt-1 text-xs text-[#817a90]'>{pincodeStatus}</p>
              )}
            </Field>
            <Field label='Address Area'>
              <AutocompleteInput
                value={form.addressArea ?? ''}
                onChange={(v) => updateField('addressArea', v)}
                options={areaOptions}
                maxLength={25}
                placeholder='e.g. Andheri West'
              />
              <p className='mt-1 text-xs text-[#817a90]'>
                Please do not fill complete address — only fill a short area
                name (max 25 characters).
              </p>
            </Field>
            <Field label='Address City *'>
              <input
                id='field-addressCity'
                value={form.addressCity ?? ''}
                onChange={(e) => updateField('addressCity', e.target.value)}
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                required
              />
            </Field>
            <Field label='Current Address (private) *'>
              <textarea
                id='field-currentAddress'
                value={form.currentAddress ?? ''}
                onChange={(e) => updateField('currentAddress', e.target.value)}
                rows={2}
                required
                className='soft-ring w-full resize-none rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                placeholder='Complete address (only visible to you and admins)'
              />
            </Field>
          </Section>

          <Section title='Family Details'>
            <Field label="Father's Name *">
              <div
                id='field-father'
                className='flex gap-2'
              >
                <select
                  value={fatherTitle}
                  onChange={(e) => {
                    setAllowDraftSave(true);
                    setFatherTitle(e.target.value);
                  }}
                  required
                  className='soft-ring w-24 shrink-0 rounded-xl border border-[#efdfce] bg-white px-2 py-3'
                >
                  {FATHER_TITLE_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  value={fatherNameOnly}
                  onChange={(e) => {
                    setAllowDraftSave(true);
                    setFatherNameOnly(e.target.value);
                  }}
                  required
                  className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                  placeholder="Father's name"
                />
              </div>
            </Field>
            <div id='field-fatherOccupation'>
              <SelectWithOther
                label="Father's Occupation *"
                value={form.fatherOccupation ?? ''}
                onChange={(v) => updateField('fatherOccupation', v)}
                options={OCCUPATION_OPTIONS}
                required
              />
            </div>
            <div id='field-fatherPhone'>
              <PhoneField
                label={
                  fatherLate
                    ? "Father's Phone (private) — optional (Late)"
                    : "Father's Phone (private) *"
                }
                value={form.fatherPhone ?? ''}
                onChange={(v) => updateField('fatherPhone', v)}
                required={!fatherLate}
              />
            </div>
            <Field label="Mother's Name *">
              <div
                id='field-mother'
                className='flex gap-2'
              >
                <select
                  value={motherTitle}
                  onChange={(e) => {
                    setAllowDraftSave(true);
                    setMotherTitle(e.target.value);
                  }}
                  required
                  className='soft-ring w-24 shrink-0 rounded-xl border border-[#efdfce] bg-white px-2 py-3'
                >
                  {MOTHER_TITLE_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  value={motherNameOnly}
                  onChange={(e) => {
                    setAllowDraftSave(true);
                    setMotherNameOnly(e.target.value);
                  }}
                  required
                  className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                  placeholder="Mother's name"
                />
              </div>
            </Field>
            <div id='field-motherOccupation'>
              <SelectWithOther
                label="Mother's Occupation *"
                value={form.motherOccupation ?? ''}
                onChange={(v) => updateField('motherOccupation', v)}
                options={OCCUPATION_OPTIONS}
                required
              />
            </div>
            <div id='field-motherPhone'>
              <PhoneField
                label={
                  motherLate
                    ? "Mother's Phone (private) — optional (Late)"
                    : "Mother's Phone (private) *"
                }
                value={form.motherPhone ?? ''}
                onChange={(v) => updateField('motherPhone', v)}
                required={!motherLate}
              />
            </div>
            <Field label='Number of Siblings'>
              <select
                value={String((form.siblings ?? []).length)}
                onChange={(e) => setSiblingCount(Number(e.target.value))}
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option
                    key={i}
                    value={i}
                  >
                    {i}
                  </option>
                ))}
              </select>
            </Field>
            {(form.siblings ?? []).length > 0 && (
              <div className='md:col-span-2 space-y-4'>
                {(form.siblings ?? []).map((sib, index) => (
                  <div
                    key={index}
                    className='grid gap-4 rounded-xl border border-[#efdfce] bg-[#fffaf5] p-4 md:grid-cols-2'
                  >
                    <p className='md:col-span-2 text-sm font-medium text-[#5d556a]'>
                      Sibling {index + 1}
                    </p>
                    <Field label='Name'>
                      <input
                        value={sib.name}
                        onChange={(e) =>
                          updateSibling(index, 'name', e.target.value)
                        }
                        className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                      />
                    </Field>
                    <Field label='Brother / Sister'>
                      <select
                        value={sib.relation ?? ''}
                        onChange={(e) =>
                          updateSibling(index, 'relation', e.target.value)
                        }
                        className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                      >
                        <option value=''>Select</option>
                        {SIBLING_RELATION_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label='Older / Younger'>
                      <select
                        value={sib.ageRelation ?? ''}
                        onChange={(e) =>
                          updateSibling(index, 'ageRelation', e.target.value)
                        }
                        className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                      >
                        <option value=''>Select</option>
                        {SIBLING_AGE_RELATION_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label='Marital Status'>
                      <select
                        value={sib.maritalStatus ?? ''}
                        onChange={(e) =>
                          updateSibling(index, 'maritalStatus', e.target.value)
                        }
                        className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                      >
                        <option value=''>Select</option>
                        {SIBLING_MARITAL_STATUS_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <SelectWithOther
                      label='Education'
                      value={sib.education}
                      onChange={(v) => updateSibling(index, 'education', v)}
                      options={EDUCATION_OPTIONS}
                    />
                    <SelectWithOther
                      label='Profession'
                      value={sib.profession}
                      onChange={(v) => updateSibling(index, 'profession', v)}
                      options={OCCUPATION_OPTIONS}
                    />
                  </div>
                ))}
              </div>
            )}
            <TextField
              label='Other Phone (private) — optional'
              value={form.otherPhone ?? ''}
              onChange={(v) => updateField('otherPhone', v)}
              placeholder='Other phone no. with name'
            />
            <div id='field-coordinator'>
              <PhoneField
                label='Coordinator Number *'
                value={form.coordinatorNumber ?? ''}
                onChange={(v) => updateField('coordinatorNumber', v)}
                required
              />
            </div>            <Field label='Other Details'>
              <textarea
                value={form.otherDetails ?? ''}
                onChange={(e) => updateField('otherDetails', e.target.value)}
                rows={3}
                className='soft-ring w-full resize-none rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                placeholder='Extra family or other notes'
              />
            </Field>
          </Section>

          <FormGroupHeading
            title='3. About & Photos'
            subtitle='Tell families about yourself and add photos'
          />

          <Section title='About & Interests'>
            <Field label='About *'>
              <textarea
                id='field-about'
                value={form.about}
                onChange={(e) => updateField('about', e.target.value)}
                rows={5}
                minLength={20}
                maxLength={1000}
                className='soft-ring w-full resize-none rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                placeholder='Write something meaningful about yourself (at least 20 characters)'
                required
              />
              <p className='mt-1 text-xs text-[#817a90]'>
                {form.about.trim().length}/1000 characters (minimum 20)
              </p>
            </Field>
            <Field label='Interests (comma separated) *'>
              <input
                id='field-interests'
                value={interestsText}
                onChange={(e) => {
                  setAllowDraftSave(true);
                  setInterestsText(e.target.value);
                }}
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
                placeholder='Reading, Traveling, Sports'
                required
              />
            </Field>
            <Field label='Languages Known *'>
              <div id='field-languages'>
                <MultiSelectDropdown
                  options={LANGUAGE_OPTIONS}
                  value={form.languagesKnown ?? []}
                  onChange={(vals) => updateField('languagesKnown', vals)}
                  placeholder='Select languages'
                />
              </div>
            </Field>
          </Section>

          <Section title='Photos'>
            <Field label='Upload Photos (JPG, PNG, WEBP) *'>
              <input
                id='field-photos'
                type='file'
                multiple
                accept='image/jpeg,image/png,image/webp'
                onChange={onSelectPhotos}
                disabled={isUploadingPhotos || isSaving || cropQueue.length > 0}
                className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60'
              />
              <p className='mt-1 text-xs text-[#817a90]'>
                At least one photo is required. Upload up to 5 photos. Each photo
                is cropped to a fixed 3:4 portrait frame so listings look
                uniform on desktop and mobile.
                {!hasSavedProfile
                  ? ' Selected photos are saved together with your profile on first save.'
                  : ' The primary photo cannot be deleted until you set another photo as primary.'}
              </p>
            </Field>

            {(photos.length > 0 || pendingPhotos.length > 0) && (
              <div className='md:col-span-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {photos.map((photo: ProfileImage) => (
                  <div
                    key={photo.id}
                    className='rounded-xl border border-[#efdfce] bg-[#fffaf5] p-3'
                  >
                    <ProfileEditPhotoThumb src={imgUrl(photo.url)} />
                    <div className='mt-3 flex flex-wrap gap-2'>
                      <button
                        type='button'
                        onClick={() => onSetPrimaryPhoto(photo.id)}
                        className='rounded-full border border-[#ebd8c4] px-3 py-1.5 text-xs font-medium text-[#4f455d] hover:bg-[#fff1e5]'
                      >
                        {photo.isPrimary ? 'Primary' : 'Set Primary'}
                      </button>
                      <button
                        type='button'
                        onClick={() => onDeletePhoto(photo.id)}
                        disabled={photo.isPrimary || photos.length <= 1}
                        title={
                          photo.isPrimary
                            ? 'Set another photo as primary before deleting this one'
                            : photos.length <= 1
                              ? 'At least one photo is required'
                              : 'Delete photo'
                        }
                        className='rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {pendingPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className='rounded-xl border border-dashed border-[#d4b896] bg-[#fffaf5] p-3'
                  >
                    <ProfileEditPhotoThumb src={photo.previewUrl} />
                    <p className='mt-2 text-xs text-[#8a8099]'>
                      {photos.length === 0 && index === 0
                        ? 'Pending — will be primary on save'
                        : 'Pending — uploads on save'}
                    </p>
                    <div className='mt-2'>
                      <button
                        type='button'
                        onClick={() => removePendingPhoto(photo.id)}
                        className='rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50'
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {photos.length === 0 && pendingPhotos.length === 0 && (
              <p className='md:col-span-2 text-sm text-red-600'>
                At least one photo is required.
              </p>
            )}
          </Section>

          {completion?.sections?.length ? (
            <div className='rounded-2xl border border-[#f0dfcf] bg-white p-6'>
              <h2 className='text-lg font-semibold text-[#2e263b]'>
                Section Completion
              </h2>
              <div className='mt-4 grid gap-3 md:grid-cols-2'>
                {completion.sections.map((section) => (
                  <div
                    key={section.section}
                    className='rounded-xl border border-[#f3e6d9] bg-[#fffaf5] p-4'
                  >
                    <p className='text-sm font-semibold capitalize text-[#362e45]'>
                      {section.section.replace(/_/g, ' ')}
                    </p>
                    <p className='mt-1 text-sm text-[#655e71]'>
                      {section.completed}/{section.total} ({section.percentage}
                      %)
                    </p>
                    {section.missingFields.length > 0 && (
                      <p className='mt-1 text-xs text-[#8a8099]'>
                        Missing: {section.missingFields.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div
            id='field-disclaimer'
            className='rounded-2xl border border-[#f0dfcf] bg-[#fffaf5] p-5'
          >
            <label className='flex cursor-pointer items-start gap-3'>
              <input
                type='checkbox'
                checked={agreedToDisclaimer}
                onChange={(e) => setAgreedToDisclaimer(e.target.checked)}
                className='mt-1 h-4 w-4 shrink-0 rounded border-[#d4c4b0] text-primary focus:ring-primary'
              />
              <span className='text-sm leading-relaxed text-[#4f455d]'>
                I agree to the terms and conditions of this website and confirm
                that all information saved by me is true and correct to the best
                of my knowledge.
              </span>
            </label>
          </div>

          <div className='flex items-center gap-3'>
            <button
              type='submit'
              disabled={isSaving || isUploadingPhotos || !agreedToDisclaimer}
              className='rounded-full gradient-primary px-8 py-3 font-semibold text-white disabled:opacity-60'
            >
              {isSaving ? 'Saving...' : 'Save Full Profile'}
            </button>
            <p className='text-sm text-[#766d85]'>
              {isUploadingPhotos
                ? 'Uploading photos...'
                : 'Your details are saved securely to your profile.'}
            </p>
          </div>
          </form>
        )}
      </div>

      {cropQueue[0] && (
        <PhotoCropModal
          key={`${cropQueue[0].name}-${cropQueue[0].lastModified}-${cropQueue.length}`}
          file={cropQueue[0]}
          queueIndex={croppedBatch.length + 1}
          queueTotal={croppedBatch.length + cropQueue.length}
          onCancel={onCropCancel}
          onConfirm={(cropped) => void onCropConfirm(cropped)}
        />
      )}

      {showThanksModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl'>
            <h2 className='headline-serif text-2xl font-semibold text-[#2a2237]'>
              Thank you for saving your profile
            </h2>
            <p className='mt-4 text-[#5d556a] leading-relaxed'>
              Please contact Maher Marriage Bureau at{' '}
              <span className='font-semibold text-[#2a2237]'>{BUREAU_CONTACT}</span>{' '}
              to verify your profile. In the meantime, feel free to browse other
              profiles.
            </p>
            <button
              type='button'
              onClick={() => {
                setShowThanksModal(false);
                router.push('/');
              }}
              className='mt-6 w-full rounded-full gradient-primary px-6 py-3 font-semibold text-white'
            >
              Browse Profiles
            </button>
            <p className='mt-3 text-xs text-[#8a8099]'>
              Redirecting to the home page shortly…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FormGroupHeading({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className='pt-2'>
      <div className='flex items-center gap-3'>
        <h2 className='headline-serif shrink-0 text-2xl font-semibold text-[#251e31]'>
          {title}
        </h2>
        <div className='h-px min-w-8 flex-1 bg-[#efdfce]' />
      </div>
      {subtitle ? (
        <p className='mt-1 text-sm text-[#655e71]'>{subtitle}</p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className='rounded-2xl border border-[#f0dfcf] bg-white p-6 md:p-7'>
      <h2 className='mb-5 text-xl font-semibold text-[#2e263b]'>{title}</h2>
      <div className='grid gap-5 md:grid-cols-2'>{children}</div>
    </section>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className='block'>
      <span className='mb-1.5 block text-sm font-medium text-[#5d556a]'>
        {label}
      </span>
      {children}
    </label>
  );
}

// Caste preference multi-select that reveals a free-text box when the member
// picks "Other", so they can type caste(s) not present in the list. The typed
// values are stored directly in `castePreference` (the "Other" flag itself is
// never persisted).
function CastePreferenceField({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const OTHER_SENTINEL = 'Other';
  const known = useMemo(
    () => new Set(CASTE_PREFERENCE_OPTIONS.map((opt) => opt.value)),
    []
  );
  const selected = value
    ? value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const predefined = selected.filter(
    (v) => known.has(v) && v !== OTHER_SENTINEL
  );
  const customs = selected.filter((v) => !known.has(v));
  const [showOther, setShowOther] = useState(
    selected.includes(OTHER_SENTINEL) || customs.length > 0
  );
  const [otherText, setOtherText] = useState(customs.join(', '));

  const emit = (preds: string[], other: string) => {
    const customList = other
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onChange([...preds, ...customList].join(', '));
  };

  const dropdownValue = showOther
    ? [...predefined, OTHER_SENTINEL]
    : predefined;

  return (
    <Field label='Caste Preference * (select one or more)'>
      <MultiSelectDropdown
        options={CASTE_PREFERENCE_OPTIONS}
        value={dropdownValue}
        allowCustom={false}
        onChange={(vals) => {
          const hasOther = vals.includes(OTHER_SENTINEL);
          const preds = vals.filter((v) => v !== OTHER_SENTINEL);
          setShowOther(hasOther);
          emit(preds, hasOther ? otherText : '');
        }}
        placeholder='Select caste preferences'
      />
      {showOther && (
        <input
          value={otherText}
          onChange={(e) => {
            setOtherText(e.target.value);
            emit(predefined, e.target.value);
          }}
          placeholder='Add caste(s) — separate multiple with commas'
          className='soft-ring mt-2 w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
        />
      )}
    </Field>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
        placeholder={placeholder}
      />
    </Field>
  );
}

// Digits-only phone input (max 10), so members cannot type stray characters.
function PhoneField({
  label,
  value,
  onChange,
  placeholder,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        inputMode='numeric'
        maxLength={10}
        required={required}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, '').slice(0, 10))
        }
        className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
        placeholder={placeholder}
      />
    </Field>
  );
}

// Dropdown that reveals a "please specify" text box when the member picks
// "Other"/"Others". The typed value replaces the sentinel so the profile stores real text.
function SelectWithOther({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = 'Select',
  maxLength,
  sanitize
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FieldOption[];
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  sanitize?: (value: string) => string;
}) {
  const otherOption = options.find((opt) => /^others?$/i.test(opt.value));
  const optionValues = options.map((opt) => opt.value);
  const isKnown = value === '' || optionValues.includes(value);
  const isSentinel = Boolean(otherOption && /^others?$/i.test(value));
  const [otherMode, setOtherMode] = useState(
    !!otherOption && ((value !== '' && !isKnown) || isSentinel)
  );

  const selectValue = otherMode ? (otherOption?.value ?? '') : value;
  const inputValue = isSentinel ? '' : value;

  return (
    <Field label={label}>
      <select
        value={selectValue}
        required={required && !otherMode}
        onChange={(e) => {
          const next = e.target.value;
          if (otherOption && next === otherOption.value) {
            setOtherMode(true);
            onChange('');
          } else {
            setOtherMode(false);
            onChange(next);
          }
        }}
        className='soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
      >
        <option value=''>{placeholder}</option>
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {otherMode && (
        <input
          value={inputValue}
          required={required}
          maxLength={maxLength}
          onChange={(e) =>
            onChange(sanitize ? sanitize(e.target.value) : e.target.value)
          }
          placeholder={
            maxLength
              ? `Please specify (letters only, max ${maxLength})`
              : 'Please specify'
          }
          className='soft-ring mt-2 w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3'
        />
      )}
    </Field>
  );
}

/** Profile-edit photo thumb — uses uploads URL and shows a fallback if the file is missing. */
function ProfileEditPhotoThumb({ src }: { src: string }) {
  const [broken, setBroken] = useState(!src);

  if (!src || broken) {
    return (
      <div className='relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 px-2 text-center text-xs text-[#817a90]'>
        File missing
      </div>
    );
  }

  return (
    <div className='relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100'>
      <Image
        src={src}
        alt='Uploaded profile photo'
        fill
        unoptimized
        sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
        className='object-cover'
        onError={() => setBroken(true)}
      />
    </div>
  );
}
