import type { Metadata } from "next";
import GalleryPage from "../../components/GalleryPage";

export const metadata: Metadata = { title: "Gallery | Aspio Ethiopia", description: "Real photos and videos from salons and barbershops on Aspio." };

export default function EnglishGallery() { return <GalleryPage language="en" />; }
