import type { Metadata } from "next";
import GalleryPage from "../../components/GalleryPage";

export const metadata: Metadata = { title: "ጋለሪ | Aspio Ethiopia", description: "የአስፒዮ ኢትዮጵያ ማህበረሰብ ምስሎች እና ቪዲዮዎች።" };

export default function AmharicGallery() { return <GalleryPage language="am" />; }
