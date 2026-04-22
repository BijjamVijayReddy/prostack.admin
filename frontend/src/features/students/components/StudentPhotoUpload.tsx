"use client";

import { useRef } from "react";
import { UserCircleIcon, CameraIcon } from "@heroicons/react/24/outline";

interface Props {
  photo: string | null;
  setPhoto: (val: string) => void;
}

export function StudentPhotoUpload({ photo, setPhoto }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 200;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4 ">
      {/* AVATAR */}
      <div className="relative h-24 w-24 ">
        {photo ? (
          <img
            src={photo}
            alt="Student"
            className="h-24 w-24 rounded-full object-cover border"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-gray-100">
            <UserCircleIcon className="h-16 w-16 text-gray-400 " />
          </div>
        )}

        {/* CAMERA ICON */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-1 text-white hover:bg-indigo-700 cursor-pointer"
          title="Upload photo"
        >
          <CameraIcon className="h-4 w-4 cursor-pointer" />
        </button>
      </div>

      {/* FILE INPUT */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) =>
          e.target.files && handleFile(e.target.files[0])
        }
      />

      {/* TEXT */}
      <div className="text-sm text-gray-600">
        <p className="font-medium">Student Photo</p>
        <p className="text-xs">PNG, JPG up to 5MB</p>
      </div>
    </div>
  );
}