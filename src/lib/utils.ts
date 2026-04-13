import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const djStyleText = "bg-gradient-to-r from-[#007FFF] via-[#00CED1] to-[#32CD32] bg-clip-text text-transparent font-black";
export const djStyleBg = "bg-gradient-to-r from-[#007FFF] via-[#00CED1] to-[#32CD32] text-white";

export const DJ_LOGO_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
  <path d="M12 2C6.477 2 2 6.145 2 11.258C2 14.17 3.43 16.738 5.664 18.475V22L9.043 20.145C9.993 20.41 10.982 20.516 12 20.516C17.523 20.516 22 16.371 22 11.258C22 6.145 17.523 2 12 2Z" fill="url(#dj-gradient)"/>
  <path d="M7 14L10.5 9L13 11.5L17 10L13.5 15L11 12.5L7 14Z" fill="white"/>
  <defs>
    <linearGradient id="dj-gradient" x1="2" y1="2" x2="22" y2="20.5" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#007FFF" />
      <stop offset="50%" stop-color="#00CED1" />
      <stop offset="100%" stop-color="#32CD32" />
    </linearGradient>
  </defs>
</svg>
`;

export function compressImage(file: File, maxWidth = 400, maxHeight = 400, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
