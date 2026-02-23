"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PersonRoleButtons from "@/components/PersonRoleButtons";
import SpecialtyPillSelector from "@/components/SpecialtyPillSelector";
import SimpleImageUpload from "@/components/SimpleImageUpload";
import { Country, PersonRole, RoasterImage } from "@/types";

type HoursDay = {
  open: string;
  close: string;
  closed: boolean;
};

const buildDefaultHours = (): Record<string, HoursDay> => ({
  monday: { open: "08:00", close: "18:00", closed: false },
  tuesday: { open: "08:00", close: "18:00", closed: false },
  wednesday: { open: "08:00", close: "18:00", closed: false },
  thursday: { open: "08:00", close: "18:00", closed: false },
  friday: { open: "08:00", close: "18:00", closed: false },
  saturday: { open: "08:00", close: "18:00", closed: false },
  sunday: { open: "08:00", close: "18:00", closed: false },
});

const normalizeHours = (hours: any): Record<string, HoursDay> => {
  let normalized = hours;
  if (typeof normalized === "string") {
    try {
      normalized = JSON.parse(normalized);
    } catch (error) {
      console.warn("normalizeHours: failed to parse string hours", error);
      normalized = null;
    }
  }

  if (!normalized || typeof normalized !== "object") {
    return buildDefaultHours();
  }

  if (normalized.monday && typeof normalized.monday === "object" && "open" in normalized.monday) {
    return normalized as Record<string, HoursDay>;
  }

  const converted: Record<string, HoursDay> = {};
  [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ].forEach((day) => {
    const dayHours = normalized[day];
    if (!dayHours || dayHours === "closed") {
      converted[day] = { open: "", close: "", closed: true };
      return;
    }
    if (typeof dayHours === "string" && dayHours.includes("-")) {
      const [open, close] = dayHours.split("-");
      converted[day] = { open: open || "", close: close || "", closed: false };
      return;
    }
    converted[day] = { open: "", close: "", closed: true };
  });

  return converted;
};

const buildHoursPayload = (currentHours: Record<string, HoursDay>): Record<string, string> => {
  const converted: Record<string, string> = {};
  Object.entries(currentHours).forEach(([day, dayHours]) => {
    if (dayHours?.closed) {
      converted[day] = "closed";
      return;
    }
    const open = dayHours?.open || "08:00";
    const close = dayHours?.close || "18:00";
    converted[day] = `${open}-${close}`;
  });
  return converted;
};

const toNullIfEmpty = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

interface AdminRoasterEditLayoutProps {
  roasterId?: string;
  roasterName?: string;
}

export default function AdminRoasterEditLayout({ roasterId, roasterName = "[Roaster Name]" }: AdminRoasterEditLayoutProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState("basic");
  const isEditing = Boolean(roasterId);
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    founded: "",
  });
  const [locationInfo, setLocationInfo] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    latitude: "",
    longitude: "",
  });
  const [socialInfo, setSocialInfo] = useState({
    instagram: "",
    tiktok: "",
    facebook: "",
    linkedin: "",
    youtube: "",
    threads: "",
    pinterest: "",
    bluesky: "",
    x: "",
    reddit: "",
  });
  const [contactInfo, setContactInfo] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    mobile: "",
    linkedinUrl: "",
    instagramUrl: "",
    roles: [] as PersonRole[],
    isPrimary: false,
    bio: "",
  });
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesFilter, setCountriesFilter] = useState("");
  const [images, setImages] = useState<RoasterImage[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [urlImages, setUrlImages] = useState<string[]>([]);
  const [newUrlImage, setNewUrlImage] = useState("");
  const [hours, setHours] = useState<Record<string, HoursDay>>(buildDefaultHours());
  const [showHours, setShowHours] = useState(true);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [rating, setRating] = useState(0);
  const [verified, setVerified] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [isContactLoading, setIsContactLoading] = useState(false);
  const canShowHours = !onlineOnly && showHours;
  const [isDeleting, setIsDeleting] = useState(false);

  const contactCount = useMemo(() => {
    const hasText = (value: string) => value.trim().length > 0;
    const hasAnyText = [
      contactInfo.firstName,
      contactInfo.lastName,
      contactInfo.title,
      contactInfo.email,
      contactInfo.mobile,
      contactInfo.linkedinUrl,
      contactInfo.instagramUrl,
      contactInfo.bio,
    ].some(hasText);

    return hasAnyText || contactInfo.roles.length > 0 || contactInfo.isPrimary ? 1 : 0;
  }, [contactInfo]);

  const socialCount = useMemo(() => {
    return Object.values(socialInfo).filter((value) => value.trim().length > 0).length;
  }, [socialInfo]);

  const hoursCount = useMemo(() => {
    return Object.values(hours).filter((dayHours) => {
      if (!dayHours || dayHours.closed) return false;
      return Boolean(dayHours.open?.trim() || dayHours.close?.trim());
    }).length;
  }, [hours]);

  const filteredCountries = useMemo(() => {
    const normalizedFilter = countriesFilter.trim().toLowerCase();
    if (!normalizedFilter) return availableCountries;
    return availableCountries.filter((country) => country.name.toLowerCase().includes(normalizedFilter));
  }, [availableCountries, countriesFilter]);

  const sections = useMemo(() => {
    const baseSections = [
      { key: "basic", label: t('adminForms.roasters.sections.basic', 'Basic') },
      { key: "location", label: t('adminForms.roasters.sections.location', 'Location') },
      { key: "socials", label: t('adminForms.roasters.sections.socials', 'Socials'), count: socialCount },
      { key: "contacts", label: t('adminForms.roasters.sections.contacts', 'Contacts'), count: contactCount },
      { key: "specialties", label: t('adminForms.roasters.sections.specialties', 'Specialties'), count: selectedSpecialtyIds.length },
      { key: "countries", label: t('adminForms.roasters.sections.countries', 'Countries'), count: selectedCountries.length },
    ];

    if (isEditing) {
      baseSections.push({ key: "images", label: t('adminForms.roasters.sections.images', 'Images'), count: images.length });
    }

    if (isEditing) {
      baseSections.push({ key: "urlImages", label: t('adminForms.roasters.sections.urlImages', 'URL Images'), count: urlImages.length });
    }

    baseSections.push({ key: "hours", label: t('adminForms.roasters.sections.hours', 'Hours'), count: hoursCount });

    return baseSections;
  }, [contactCount, hoursCount, images.length, isEditing, selectedCountries.length, selectedSpecialtyIds.length, socialCount, t, urlImages.length]);

  const sectionKeys = useMemo(() => new Set(sections.map((section) => section.key)), [sections]);

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && sectionKeys.has(urlTab) && urlTab !== selected) {
      setSelected(urlTab);
    }
  }, [searchParams, sectionKeys, selected]);

  const handleTabSelect = (sectionKey: string) => {
    setSelected(sectionKey);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", sectionKey);
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBasicInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocationInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSocialInfo((prev) => ({ ...prev, [name]: value }));
  };
  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };
  const handleContactRoleToggle = (role: PersonRole) => {
    setContactInfo((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((existingRole) => existingRole !== role)
        : [...prev.roles, role],
    }));
  };

  const handleDelete = async () => {
    if (!roasterId || isDeleting) return;

    const confirmed = window.confirm(
      t('adminForms.roasters.deleteConfirm', 'Are you sure you want to delete this roaster? This action cannot be undone.')
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setSaveError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/roasters/${roasterId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        router.push("/admin/roasters");
        return;
      }

      const errorData = await response.json().catch(() => null);
      setSaveError(errorData?.error || t('adminForms.roasters.deleteFailed', 'Failed to delete roaster.'));
    } catch (error) {
      setSaveError(t('adminForms.roasters.deleteFailed', 'Failed to delete roaster.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHoursChange = (day: string, field: keyof HoursDay, value: string | boolean) => {
    setHours((prev) => {
      const currentDay = prev[day] || { open: "08:00", close: "18:00", closed: false };
      if (field === "closed") {
        if (value === false) {
          return {
            ...prev,
            [day]: {
              ...currentDay,
              closed: false,
              open: currentDay.open || "08:00",
              close: currentDay.close || "18:00",
            },
          };
        }
        return {
          ...prev,
          [day]: {
            ...currentDay,
            closed: true,
          },
        };
      }

      if (field === "open" && typeof value === "string") {
        const closeTime = currentDay.close || "18:00";
        if (closeTime && value >= closeTime) {
          const [hoursPart, minutesPart] = value.split(":");
          const newCloseHour = Math.min(23, parseInt(hoursPart, 10) + 1);
          return {
            ...prev,
            [day]: {
              ...currentDay,
              open: value,
              close: `${newCloseHour.toString().padStart(2, "0")}:${minutesPart}`,
            },
          };
        }
      }

      if (field === "close" && typeof value === "string") {
        const openTime = currentDay.open || "08:00";
        if (openTime && value <= openTime) {
          return prev;
        }
      }

      return {
        ...prev,
        [day]: {
          ...currentDay,
          [field]: value,
        },
      };
    });
  };

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/countries`);
        if (response.ok) {
          const data = await response.json();
          setAvailableCountries(data);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchSourceCountries = async () => {
      if (!roasterId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/roasters/${roasterId}/source-countries`);
        if (response.ok) {
          const data = await response.json();
          setSelectedCountries(data.map((country: Country) => country.id));
        }
      } catch (error) {
        console.error("Error fetching source countries:", error);
      }
    };

    fetchSourceCountries();
  }, [roasterId]);

  useEffect(() => {
    if (!roasterId) return;

    const fetchRoaster = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/api/roasters/${roasterId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) return;

        const data = await response.json();
        const socialNetworks = data.socialNetworks || {};

        setBasicInfo({
          name: data.name || "",
          description: data.description || "",
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          founded: data.founded ? String(data.founded) : "",
        });

        setLocationInfo({
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
          country: data.country || "",
          latitude: data.latitude ? String(data.latitude) : "",
          longitude: data.longitude ? String(data.longitude) : "",
        });

        setSocialInfo({
          instagram: socialNetworks.instagram || "",
          tiktok: socialNetworks.tiktok || "",
          facebook: socialNetworks.facebook || "",
          linkedin: socialNetworks.linkedin || "",
          youtube: socialNetworks.youtube || "",
          threads: socialNetworks.threads || "",
          pinterest: socialNetworks.pinterest || "",
          bluesky: socialNetworks.bluesky || "",
          x: socialNetworks.x || "",
          reddit: socialNetworks.reddit || "",
        });

        setShowHours(typeof data.showHours === "boolean" ? data.showHours : true);
        setOnlineOnly(Boolean(data.onlineOnly));
        setRating(typeof data.rating === "number" ? data.rating : 0);
        setVerified(Boolean(data.verified));
        setFeatured(Boolean(data.featured));
        setHours(normalizeHours(data.hours));

        setSelectedSpecialtyIds(data.specialties?.map((specialty: { id: string }) => specialty.id) || []);
      } catch (error) {
        console.error("Error fetching roaster details:", error);
      }
    };

    fetchRoaster();
  }, [roasterId]);

  useEffect(() => {
    if (!roasterId) return;

    const fetchPrimaryContact = async () => {
      try {
        setIsContactLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/api/people/roaster/${roasterId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        if (!response.ok) return;

        const data = await response.json();
        const peopleList = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        if (peopleList.length === 0) return;

        const primaryPerson = peopleList.find((person: any) => person.isPrimary) || peopleList[0];

        setContactInfo({
          firstName: primaryPerson.firstName || "",
          lastName: primaryPerson.lastName || "",
          title: primaryPerson.title || "",
          email: primaryPerson.email || "",
          mobile: primaryPerson.mobile || "",
          linkedinUrl: primaryPerson.linkedinUrl || "",
          instagramUrl: primaryPerson.instagramUrl || "",
          roles: primaryPerson.roles || [],
          isPrimary: Boolean(primaryPerson.isPrimary),
          bio: primaryPerson.bio || "",
        });
      } catch (error) {
        console.error("Error fetching contact person:", error);
      } finally {
        setIsContactLoading(false);
      }
    };

    fetchPrimaryContact();
  }, [roasterId]);

  useEffect(() => {
    if (!roasterId) {
      setImages([]);
      setImagesLoaded(false);
      setUrlImages([]);
      return;
    }

    const fetchImages = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/roasters/${roasterId}/images`);
        if (response.ok) {
          const data = await response.json();
          setImages(data.images || []);
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setImagesLoaded(true);
      }
    };

    const fetchUrlImages = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/api/roasters/${roasterId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (response.ok) {
          const data = await response.json();
          const imagesFromApi = Array.isArray(data.images) ? data.images : [];
          const fallbackImage = data.imageUrl ? [data.imageUrl] : [];
          setUrlImages(imagesFromApi.length > 0 ? imagesFromApi : fallbackImage);
        }
      } catch (error) {
        console.error("Error fetching roaster details:", error);
      }
    };

    fetchImages();
    fetchUrlImages();
  }, [roasterId]);

  const convertToImageUrl = (url: string): string => {
    if (!url) return url;

    if (url.includes('unsplash.com')) {
      if (url.includes('images.unsplash.com')) {
        return url;
      }

      if (url.includes('/photos/')) {
        const photoPathMatch = url.match(/\/photos\/([^/?#]+)/);
        if (photoPathMatch) {
          const photoId = photoPathMatch[1];
          return `https://images.unsplash.com/photo-${photoId}?w=800&h=600&fit=crop&auto=format&q=80`;
        }
      }
    }

    return url;
  };

  const addUrlImage = (rawUrl: string) => {
    const trimmedUrl = rawUrl.trim();
    if (!trimmedUrl || !trimmedUrl.startsWith("http")) return;
    const convertedUrl = convertToImageUrl(trimmedUrl);
    setUrlImages((prev) => [...prev, convertedUrl]);
    setNewUrlImage("");
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const showToast = (message: string, variant: "success" | "error") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  const hasContactData = () => {
    const hasText = (value: string) => value.trim().length > 0;
    const textFields = [
      contactInfo.firstName,
      contactInfo.lastName,
      contactInfo.title,
      contactInfo.email,
      contactInfo.mobile,
      contactInfo.linkedinUrl,
      contactInfo.instagramUrl,
      contactInfo.bio,
    ];
    return textFields.some(hasText) || contactInfo.roles.length > 0 || contactInfo.isPrimary;
  };

  const toOptionalString = (value: string) => value.trim();

  const buildContactPayload = (effectiveRoasterId: string) => ({
    roasterId: effectiveRoasterId,
    firstName: contactInfo.firstName.trim(),
    lastName: toOptionalString(contactInfo.lastName),
    title: toOptionalString(contactInfo.title),
    email: toOptionalString(contactInfo.email),
    mobile: toOptionalString(contactInfo.mobile),
    linkedinUrl: toOptionalString(contactInfo.linkedinUrl),
    instagramUrl: toOptionalString(contactInfo.instagramUrl),
    bio: toOptionalString(contactInfo.bio),
    roles: contactInfo.roles,
    isPrimary: contactInfo.isPrimary,
  });

  const handleSave = async () => {
    setSaveError(null);

    const trimmedName = basicInfo.name.trim();
    const trimmedCountry = locationInfo.country.trim();

    if (!trimmedName) {
      setSaveError(t('adminForms.roasters.nameRequired', 'Name is required'));
      setSelected("basic");
      return;
    }

    if (!trimmedCountry) {
      setSaveError(t('adminForms.roasters.countryRequired', 'Country is required'));
      showToast(t('adminForms.roasters.countryRequired', 'Country is required'), "error");
      setSelected("location");
      return;
    }

    if (hasContactData() && !contactInfo.firstName.trim()) {
      const contactMessage = t('adminForms.roasters.contactFirstNameRequired', 'Contact first name is required');
      setSaveError(contactMessage);
      showToast(contactMessage, "error");
      setSelected("contacts");
      return;
    }

    setIsSaving(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const effectiveShowHours = onlineOnly ? false : showHours;
      const normalizedHours = normalizeHours(hours);

      const socialNetworks: Record<string, string> = {};
      Object.entries(socialInfo).forEach(([key, value]) => {
        const trimmedValue = value.trim();
        if (trimmedValue.length > 0) {
          socialNetworks[key] = trimmedValue;
        }
      });

      const payload = {
        name: trimmedName,
        description: toNullIfEmpty(basicInfo.description),
        email: toNullIfEmpty(basicInfo.email),
        phone: toNullIfEmpty(basicInfo.phone),
        website: toNullIfEmpty(basicInfo.website),
        founded: basicInfo.founded ? parseInt(basicInfo.founded, 10) : undefined,
        address: toNullIfEmpty(locationInfo.address),
        city: toNullIfEmpty(locationInfo.city),
        state: toNullIfEmpty(locationInfo.state),
        zipCode: toNullIfEmpty(locationInfo.zipCode),
        country: trimmedCountry,
        latitude: locationInfo.latitude.trim() !== "" ? parseFloat(locationInfo.latitude) : null,
        longitude: locationInfo.longitude.trim() !== "" ? parseFloat(locationInfo.longitude) : null,
        rating,
        verified,
        featured,
        onlineOnly,
        showHours: effectiveShowHours,
        hours: buildHoursPayload(normalizedHours),
        specialtyIds: selectedSpecialtyIds,
        images: urlImages,
        ...(Object.keys(socialNetworks).length > 0 ? { socialNetworks } : {}),
      };

      const url = roasterId
        ? `${apiUrl}/api/roasters/${roasterId}`
        : `${apiUrl}/api/roasters`;
      const method = roasterId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login?redirect=/admin/roasters&error=session_expired";
          return;
        }

        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => err.msg).join(", ");
          throw new Error(errorMessages);
        }

        throw new Error(errorData.error || errorData.message || "Failed to save roaster");
      }

      const savedRoaster = await response.json();
      const savedRoasterId = roasterId || savedRoaster?.id;

      if (savedRoasterId) {
        const sourceCountriesRes = await fetch(`${apiUrl}/api/roasters/${savedRoasterId}/source-countries`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ countryIds: selectedCountries }),
        });

        if (!sourceCountriesRes.ok) {
          console.error("Failed to update source countries");
        }
      }

      if (savedRoasterId && hasContactData()) {
        try {
          const tokenHeaders: HeadersInit | undefined = token
            ? { Authorization: `Bearer ${token}` }
            : undefined;
          const peopleResponse = await fetch(`${apiUrl}/api/people/roaster/${savedRoasterId}`, {
            headers: tokenHeaders,
          });

          let existingPersonId: string | null = null;
          if (peopleResponse.ok) {
            const peopleData = await peopleResponse.json();
            const peopleList = Array.isArray(peopleData)
              ? peopleData
              : Array.isArray(peopleData?.data)
                ? peopleData.data
                : [];

            const normalizedEmail = contactInfo.email.trim().toLowerCase();
            const matchedByEmail = normalizedEmail
              ? peopleList.find((person: any) => String(person.email || '').toLowerCase() === normalizedEmail)
              : null;
            const matchedByPrimary = contactInfo.isPrimary
              ? peopleList.find((person: any) => person.isPrimary)
              : null;

            existingPersonId = matchedByEmail?.id || matchedByPrimary?.id || peopleList[0]?.id || null;
          }

          const contactPayload = buildContactPayload(savedRoasterId);
          const contactUrl = existingPersonId
            ? `${apiUrl}/api/people/${existingPersonId}`
            : `${apiUrl}/api/people`;
          const contactMethod = existingPersonId ? "PUT" : "POST";

          const contactResponse = await fetch(contactUrl, {
            method: contactMethod,
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(contactPayload),
          });

          if (!contactResponse.ok) {
            console.error("Failed to save contact person");
          }
        } catch (contactError) {
          console.error("Error saving contact person:", contactError);
        }
      }

      showToast(t('adminForms.roasters.savedToast', 'Roaster saved'), "success");

      if (!roasterId && savedRoasterId) {
        router.push(`/admin/roasters/edit/${savedRoasterId}`);
      }
    } catch (error: any) {
      const message = error?.message || "Failed to save roaster";
      setSaveError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Multilingual fallback for roaster name
  const displayRoasterName = roasterName && roasterName !== "[Roaster Name]"
    ? roasterName
    : t('adminForms.roasters.addTitle', 'New Roaster');

  const language = typeof window !== "undefined" ? localStorage.getItem("language") || "en" : "en";

  const renderSectionContent = (sectionKey: string) => {
    if (sectionKey === "basic") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.name', 'Name')} *
              </label>
              <input
                type="text"
                name="name"
                value={basicInfo.name}
                onChange={handleBasicInfoChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.website', 'Website')}
              </label>
              <input
                type="url"
                name="website"
                value={basicInfo.website}
                onChange={handleBasicInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="md:col-span-3 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 pt-1">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('adminForms.roasters.verified', 'Verified')}
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('adminForms.roasters.featured', 'Featured')}
                </span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.email', 'Email')}
              </label>
              <input
                type="email"
                name="email"
                value={basicInfo.email}
                onChange={handleBasicInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.phone', 'Phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={basicInfo.phone}
                onChange={handleBasicInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="md:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('adminForms.roasters.founded', 'Founded')}
                  </label>
                  <input
                    type="number"
                    name="founded"
                    value={basicInfo.founded}
                    onChange={handleBasicInfoChange}
                    placeholder="2020"
                    min="1800"
                    max="2100"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('adminForms.roasters.rating', 'Rating')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('adminForms.roasters.description', 'Description')}
            </label>
            <textarea
              name="description"
              value={basicInfo.description}
              onChange={handleBasicInfoChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      );
    }

    if (sectionKey === "location") {
      return (
        <div className="space-y-5">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => {
                const checked = e.target.checked;
                setOnlineOnly(checked);
                if (checked) {
                  setShowHours(false);
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('adminForms.roasters.onlineOnly', 'Online Only')}
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.address', 'Address')}
              </label>
              <input
                type="text"
                name="address"
                value={locationInfo.address}
                onChange={handleLocationInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.city', 'City')}
              </label>
              <input
                type="text"
                name="city"
                value={locationInfo.city}
                onChange={handleLocationInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.state', 'State')}
              </label>
              <input
                type="text"
                name="state"
                value={locationInfo.state}
                onChange={handleLocationInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.roasters.country', 'Country')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={locationInfo.country}
                onChange={handleLocationInfoChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.roasters.zipCode', 'Zip Code')}
              </label>
              <input
                type="text"
                name="zipCode"
                value={locationInfo.zipCode}
                onChange={handleLocationInfoChange}
                className="w-full md:w-[8rem] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.roasters.latitude', 'Latitude')}
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={locationInfo.latitude}
                onChange={handleLocationInfoChange}
                className="w-full md:w-[10rem] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.roasters.longitude', 'Longitude')}
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={locationInfo.longitude}
                onChange={handleLocationInfoChange}
                className="w-full md:w-[10rem] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      );
    }

    if (sectionKey === "socials") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.instagram', 'Instagram')}
              </label>
              <input
                type="url"
                name="instagram"
                value={socialInfo.instagram}
                onChange={handleSocialInfoChange}
                placeholder="https://instagram.com/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.tiktok', 'TikTok')}
              </label>
              <input
                type="url"
                name="tiktok"
                value={socialInfo.tiktok}
                onChange={handleSocialInfoChange}
                placeholder="https://tiktok.com/@"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.facebook', 'Facebook')}
              </label>
              <input
                type="url"
                name="facebook"
                value={socialInfo.facebook}
                onChange={handleSocialInfoChange}
                placeholder="https://facebook.com/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.linkedin', 'LinkedIn')}
              </label>
              <input
                type="url"
                name="linkedin"
                value={socialInfo.linkedin}
                onChange={handleSocialInfoChange}
                placeholder="https://linkedin.com/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.youtube', 'YouTube')}
              </label>
              <input
                type="url"
                name="youtube"
                value={socialInfo.youtube}
                onChange={handleSocialInfoChange}
                placeholder="https://youtube.com/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.x', 'X')}
              </label>
              <input
                type="url"
                name="x"
                value={socialInfo.x}
                onChange={handleSocialInfoChange}
                placeholder="https://x.com/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.threads', 'Threads')}
              </label>
              <input
                type="url"
                name="threads"
                value={socialInfo.threads}
                onChange={handleSocialInfoChange}
                placeholder="https://threads.net/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.pinterest', 'Pinterest')}
              </label>
              <input
                type="url"
                name="pinterest"
                value={socialInfo.pinterest}
                onChange={handleSocialInfoChange}
                placeholder="https://pinterest.com/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.bluesky', 'Bluesky')}
              </label>
              <input
                type="url"
                name="bluesky"
                value={socialInfo.bluesky}
                onChange={handleSocialInfoChange}
                placeholder="https://bsky.app/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.reddit', 'Reddit')}
              </label>
              <input
                type="url"
                name="reddit"
                value={socialInfo.reddit}
                onChange={handleSocialInfoChange}
                placeholder="https://reddit.com/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      );
    }

    if (sectionKey === "contacts") {
      return (
        <div className="space-y-3 max-w-4xl">
          {isContactLoading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('common.loading', 'Loading...')}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px] gap-2 items-start">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.people.firstName', 'First Name')} *
              </label>
              <input
                type="text"
                name="firstName"
                value={contactInfo.firstName}
                onChange={handleContactInfoChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.people.lastName', 'Last Name')}
              </label>
              <input
                type="text"
                name="lastName"
                value={contactInfo.lastName}
                onChange={handleContactInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="col-span-2 md:col-auto md:row-span-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.people.role', 'Role')}
              </label>
              <PersonRoleButtons
                selectedRoles={contactInfo.roles}
                onRoleToggle={handleContactRoleToggle}
                size="sm"
                layout="wrap"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.people.jobTitle', 'Title')}
              </label>
              <input
                type="text"
                name="title"
                value={contactInfo.title}
                onChange={handleContactInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.people.primaryContact', 'Primary Contact')}
              </label>
              <button
                type="button"
                className={`px-6 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150 focus:outline-none ${contactInfo.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                onClick={() => setContactInfo((prev) => ({ ...prev, isPrimary: !prev.isPrimary }))}
              >
                {contactInfo.isPrimary ? t('common.yes', 'Yes') : t('common.no', 'No')}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.people.email', 'Email')}
              </label>
              <input
                type="email"
                name="email"
                value={contactInfo.email}
                onChange={handleContactInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.people.mobile', 'Mobile')}
              </label>
              <input
                type="text"
                name="mobile"
                value={contactInfo.mobile}
                onChange={handleContactInfoChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.people.instagramUrl', 'Instagram URL')}
              </label>
              <input
                type="url"
                name="instagramUrl"
                value={contactInfo.instagramUrl}
                onChange={handleContactInfoChange}
                placeholder={t('admin.people.instagramUrlPlaceholder', 'https://www.instagram.com/username')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.people.linkedinUrl', 'LinkedIn URL')}
              </label>
              <input
                type="url"
                name="linkedinUrl"
                value={contactInfo.linkedinUrl}
                onChange={handleContactInfoChange}
                placeholder={t('admin.people.linkedinUrlPlaceholder', 'https://www.linkedin.com/in/username')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.people.bio', 'Bio')}
              </label>
              <textarea
                name="bio"
                value={contactInfo.bio}
                onChange={handleContactInfoChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      );
    }

    if (sectionKey === "specialties") {
      return (
        <div className="space-y-4">
          <SpecialtyPillSelector
            selectedSpecialtyIds={selectedSpecialtyIds}
            onChange={setSelectedSpecialtyIds}
            language={language}
          />
        </div>
      );
    }

    if (sectionKey === "countries") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adminForms.roasters.countrySearch', 'Search countries')}
              </label>
              <input
                type="text"
                value={countriesFilter}
                onChange={(e) => setCountriesFilter(e.target.value)}
                placeholder={t('adminForms.roasters.countrySearchPlaceholder', 'Type to filter')}
                className="w-full md:max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          {countriesLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('common.loading', 'Loading...')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[420px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-white dark:bg-gray-800">
              {filteredCountries.map((country) => (
                <label
                  key={country.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer min-w-0"
                  title={country.name}
                >
                  <input
                    type="checkbox"
                    checked={selectedCountries.includes(country.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCountries((prev) => [...prev, country.id]);
                      } else {
                        setSelectedCountries((prev) => prev.filter((id) => id !== country.id));
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:bg-gray-700 focus:ring-blue-500 flex-shrink-0"
                  />
                  <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
                    {country.flagSvg && (
                      <img
                        src={country.flagSvg}
                        alt={`${country.name} flag`}
                        className="w-4 h-3 flex-shrink-0 object-cover rounded-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                      {country.name}
                    </span>
                  </div>
                </label>
              ))}
              {!countriesLoading && filteredCountries.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {availableCountries.length === 0
                    ? t('adminForms.roasters.noCountriesAvailable', 'No countries available')
                    : t('adminForms.roasters.noCountriesMatch', 'No countries match this filter')}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (sectionKey === "images") {
      if (!roasterId) {
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('adminForms.roasters.saveBeforeImages', 'Save the roaster first to enable image uploads.')}
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {!imagesLoaded && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('common.loading', 'Loading...')}
            </div>
          )}
          <SimpleImageUpload
            roasterId={roasterId}
            existingImages={images}
            onImagesUpdated={setImages}
            canEdit={true}
          />
        </div>
      );
    }

    if (sectionKey === "urlImages") {
      if (!roasterId) {
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('adminForms.roasters.saveBeforeUrlImages', 'Save the roaster first to manage URL images.')}
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {urlImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {urlImages.map((imageUrl, index) => (
                <div key={`${imageUrl}-${index}`} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                    <img
                      src={convertToImageUrl(imageUrl)}
                      alt={`${displayRoasterName} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (imageUrl.includes('unsplash.com') && !e.currentTarget.src.includes('/images/default-cafe.svg')) {
                          const photoId = imageUrl.match(/\/photos\/([^/?#]+)/)?.[1];
                          if (photoId) {
                            e.currentTarget.src = `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&auto=format&q=80`;
                            return;
                          }
                        }
                        e.currentTarget.src = '/images/default-cafe.svg';
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => {
                        const updated = [...urlImages];
                        updated[index] = e.target.value;
                        setUrlImages(updated);
                      }}
                      className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 w-full mr-2"
                      placeholder={t('adminForms.roasters.imageUrl', 'Image URL')}
                    />
                    <button
                      type="button"
                      onClick={() => setUrlImages((prev) => prev.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700 text-sm font-bold px-2 py-1"
                      title={t('common.remove', 'Remove')}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newUrlImage}
              onChange={(e) => setNewUrlImage(e.target.value)}
              placeholder={t('adminForms.roasters.addImageUrl', 'Add image URL...')}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addUrlImage(newUrlImage);
                }
              }}
            />
            <button
              type="button"
              onClick={() => addUrlImage(newUrlImage)}
              className="min-w-[110px] px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap ml-auto"
            >
              {t('common.add', 'Add')}
            </button>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium">{t('adminForms.roasters.aboutUrlImages', 'About URL Images:')}</p>
            <p>{t('adminForms.roasters.urlImagesFallback', 'Image URLs serve as fallback images when uploaded images are not accessible.')}</p>
          </div>
        </div>
      );
    }

    if (sectionKey === "hours") {
      return (
        <div className="space-y-5">
          {!canShowHours && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {onlineOnly
                ? t('adminForms.roasters.hoursOnlineOnly', 'Online-only roasters do not display opening hours.')
                : t('adminForms.roasters.hoursHidden', 'Enable Show Hours in Settings to edit hours.')}
            </div>
          )}

          {canShowHours && (
            <div className="space-y-4">
              {hoursExpanded && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {Object.entries(hours).map(([day, dayHours]) => (
                    <div key={day} className="p-3 bg-white dark:bg-gray-800 rounded-md space-y-2 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">
                          {t(`adminForms.roasters.hours.${day}`, day.charAt(0).toUpperCase() + day.slice(1))}
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={dayHours?.closed || false}
                            onChange={(e) => handleHoursChange(day, "closed", e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('adminForms.roasters.hours.closed', 'Closed')}
                          </span>
                        </div>
                      </div>
                      {!dayHours?.closed && (
                        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:space-x-6">
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600 dark:text-gray-300 w-12">
                              {t('adminForms.roasters.hours.open', 'Open')}:
                            </label>
                            <input
                              type="time"
                              value={dayHours?.open || "08:00"}
                              onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600 dark:text-gray-300 w-12">
                              {t('adminForms.roasters.hours.close', 'Close')}:
                            </label>
                            <input
                              type="time"
                              value={dayHours?.close || "18:00"}
                              onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {t('adminForms.roasters.sectionPlaceholder', 'Fields will appear here when you select a section.')}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000]">
          <div
            className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
              toastVariant === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toastMessage}
          </div>
        </div>
      )}
      <div className="pt-16 sm:pt-20 px-4 sm:px-8 lg:px-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-2 mb-3 mt-4 sm:mt-6 md:flex-row md:items-center md:gap-6">
            <div className="md:w-64 md:-ml-8 md:pl-8 flex-shrink-0">
              <nav>
                <Link
                  href="/admin/roasters"
                  className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline transition-colors font-medium"
                >
                  {"<"} {t('admin.roasters.backToRoasters', 'Back to Roasters')}
                </Link>
              </nav>
            </div>
            <div className="flex-1 md:pl-4 flex items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {isEditing
                  ? t('adminForms.roasters.editRoaster', 'Edit Roaster')
                  : t('admin.roasters.addTitle', 'Add Roaster')
                }
              </h1>
              <div className="text-right text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[50%]">
                {basicInfo.name?.trim() || roasterName || t('adminForms.roasters.namePlaceholder', 'Roaster Name')}
              </div>
            </div>
          </div>
        </div>
        {/* Page Title & Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-1 flex-col md:flex-row gap-8">
            {/* Left Navigation */}
            <aside className="hidden md:block md:w-64 w-full md:border-r md:border-t border-gray-200 dark:border-gray-700 py-8 pt-8 flex-shrink-0 -ml-8 pl-8">
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section.key}>
                    <button
                      className={`w-full flex items-center justify-between px-4 py-1.5 rounded-lg text-left font-medium transition-colors ${selected === section.key ? "bg-purple-700/20 text-primary-700 dark:text-white border border-purple-500" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"}`}
                      onClick={() => handleTabSelect(section.key)}
                    >
                      <span>{section.label}</span>
                      {typeof section.count === "number" && (
                        <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-600 text-white">
                          {section.count}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
            {/* Right Pane */}
            <main className="flex-1 flex flex-col">
              <div className="hidden md:flex relative p-4 bg-slate-100 dark:bg-slate-800 border border-black/90 dark:border-black rounded-lg shadow flex-col min-h-[400px]">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {sections.find(s => s.key === selected)?.label}
                  </h1>
                  <div
                    className={`flex items-center gap-4 ${selected === "hours" ? "" : "invisible pointer-events-none"}`}
                    aria-hidden={selected !== "hours"}
                  >
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showHours}
                        onChange={(e) => setShowHours(e.target.checked)}
                        disabled={onlineOnly}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className={`text-sm font-medium ${onlineOnly ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                        {t('adminForms.roasters.showHours', 'Show Hours')}
                      </span>
                    </label>
                    {canShowHours && (
                      <button
                        type="button"
                        onClick={() => setHoursExpanded((prev) => !prev)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title={hoursExpanded
                          ? t('adminForms.roasters.collapseSection', 'Collapse section')
                          : t('adminForms.roasters.expandSection', 'Expand section')}
                      >
                        <svg
                          className="w-4 h-4 transition-transform duration-200"
                          style={{ transform: hoursExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  {renderSectionContent(selected)}
                </div>
              </div>
              <div className="md:hidden space-y-6">
                {sections.map((section) => (
                  <section
                    key={section.key}
                    className="space-y-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-black/90 dark:border-black shadow p-4"
                  >
                    {section.key === "hours" ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {section.label}
                        </h2>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={showHours}
                              onChange={(e) => setShowHours(e.target.checked)}
                              disabled={onlineOnly}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className={`text-sm font-medium ${onlineOnly ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                              {t('adminForms.roasters.showHours', 'Show Hours')}
                            </span>
                          </label>
                          {canShowHours && (
                            <button
                              type="button"
                              onClick={() => setHoursExpanded((prev) => !prev)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              title={hoursExpanded
                                ? t('adminForms.roasters.collapseSection', 'Collapse section')
                                : t('adminForms.roasters.expandSection', 'Expand section')}
                            >
                              <svg
                                className="w-4 h-4 transition-transform duration-200"
                                style={{ transform: hoursExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {section.label}
                      </h2>
                    )}
                    {renderSectionContent(section.key)}
                  </section>
                ))}
              </div>
              {/* Save button */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {isEditing && selected === "basic" && (
                    <button
                      className="hidden md:inline-flex bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow disabled:opacity-70 disabled:cursor-not-allowed"
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting || isSaving}
                    >
                      {isDeleting
                        ? t('adminForms.roasters.deleting', 'Deleting...')
                        : t('adminForms.roasters.delete', 'Delete')}
                    </button>
                  )}
                  {isEditing && (
                    <button
                      className="md:hidden bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow disabled:opacity-70 disabled:cursor-not-allowed"
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting || isSaving}
                    >
                      {isDeleting
                        ? t('adminForms.roasters.deleting', 'Deleting...')
                        : t('adminForms.roasters.delete', 'Delete')}
                    </button>
                  )}
                  {saveError && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      {saveError}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-2 rounded-lg shadow disabled:opacity-70 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    type="button"
                    onClick={() => router.push("/admin/roasters")}
                    disabled={isSaving || isDeleting}
                  >
                    {t('adminForms.roasters.cancel', 'Cancel')}
                  </button>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow disabled:opacity-70 disabled:cursor-not-allowed"
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || isDeleting}
                  >
                    <span className="flex items-center space-x-2">
                      {isSaving && (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      )}
                      <span>
                        {isSaving
                          ? t('adminForms.roasters.saving', 'Saving...')
                          : t('adminForms.roasters.save', 'Save')}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
