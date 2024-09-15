"use client";
import React, { ComponentPropsWithRef, FormEvent, useState } from "react";
import axios from "axios";
import classNames from "classnames";

type Props = ComponentPropsWithRef<"input">;

const CustomFileSelector = (props: Props) => {
  return (
    <input
      {...props}
      type="file"
      accept="pdf"
      multiple
      className={classNames({
        "file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100": true,
        "file:rounded-lg file:rounded-tr-none file:rounded-br-none": true,
        "file:px-4 file:py-2 file:mr-4 file:border-none": true,
        "hover:cursor-pointer border rounded-lg text-gray-400": true,
      })}
    />
  );
};

const FileUploadForm = () => {
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const _files = Array.from(e.target.files);
      setImages(_files);
    }
  };

  const handleDownload = (data: Blob, filename: string) => {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    images.forEach((image, i) => {
      formData.append(image.name, image);
    });

    setUploading(true);

    try {
      const result = await axios.post("/api/upload", formData, {
        responseType: "blob", // important for handling binary data
      });

      setImages([]);
      console.log("Files uploaded and downloaded successfully");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <div className="flex justify-center flex-col items-start gap-10">
        <h1 className="text-2xl font-semibold">
          Convertir des fichiers PDF en XLSX
        </h1>
        <CustomFileSelector onChange={handleFileSelected} />

        {images.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Fichiers séléctionnés</h2>
            <ul className="mt-2">
              {images.map((image, i) => (
                <li key={i}>{image.name}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          className={classNames({
            "bg-gray-500 text-white hover:bg-gray-800 px-4 py-2 rounded-md":
              true,
            "disabled:pointer-events-none opacity-40": uploading,
          })}
          disabled={uploading}
        >
          Convertir
        </button>

        {uploading && <p>Chargement...</p>}
      </div>
    </form>
  );
};

export default function Home() {
  return (
    <main className="flex min-h-screen p-24">
      <FileUploadForm />
    </main>
  );
}
