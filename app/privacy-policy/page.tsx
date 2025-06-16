import type { Metadata } from "next";
import { getMetadataBase } from "@/lib/ogUtils";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: getMetadataBase(),
    title: "Privacy Policy - Brahma Kumaris Meditation Center Locator",
    description: "Privacy Policy for the Brahma Kumaris Meditation Center Locator Application",
  };
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-spirit-purple-800 mb-6">
          Privacy Policy for Brahma Kumaris Meditation Center Locator App
        </h1>
        
        <p className="text-neutral-500 mb-6">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            1. Introduction
          </h2>
          <p className="text-neutral-700 mb-4">
            The Brahma Kumaris Meditation Center Locator ("we," "us," or "our") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website application.
          </p>
          <p className="text-neutral-700">
            Please read this Privacy Policy carefully. By accessing or using the application, you acknowledge that you have read, 
            understood, and agree to be bound by this Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            2. Information We Collect
          </h2>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              2.1. Personal Information
            </h3>
            <p className="text-neutral-700 mb-2">
              We may collect the following personal information when you use our contact forms:
            </p>
            <ul className="list-disc pl-6 text-neutral-700">
              <li className="mb-1">Name</li>
              <li className="mb-1">Email address</li>
              <li className="mb-1">Phone number (optional)</li>
              <li className="mb-1">Message content</li>
              <li className="mb-1">Contact type (Learn Meditation, Query, Attend Event, Feedback, Others)</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              2.2. Automatically Collected Information
            </h3>
            <p className="text-neutral-700 mb-2">
              When you use our application, we may automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 text-neutral-700">
              <li className="mb-1">Device information (browser type, operating system)</li>
              <li className="mb-1">IP address</li>
              <li className="mb-1">Pages visited</li>
              <li className="mb-1">Time and date of your visit</li>
              <li className="mb-1">Referring website</li>
              <li className="mb-1">User agent information</li>
              <li className="mb-1">Page URL</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              2.3. Location Information
            </h3>
            <p className="text-neutral-700">
              With your consent, we collect your geolocation information to help you find meditation centers near you. 
              You can disable location services in your device settings at any time.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            3. How We Use Your Information
          </h2>
          <p className="text-neutral-700 mb-2">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc pl-6 text-neutral-700">
            <li className="mb-1">To provide support and respond to your inquiries</li>
            <li className="mb-1">To send emails to meditation centers on your behalf when you use the contact form</li>
            <li className="mb-1">To find and display meditation centers near your location</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            4. Sharing of Your Information
          </h2>
          <p className="text-neutral-700">
            When you use our contact form, your information (name, email address, phone number, and message) 
            is shared with the specific meditation center you are contacting.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            5. Data Security
          </h2>
          <p className="text-neutral-700">
            We implement appropriate technical and organizational measures to protect your personal information. 
            However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            6. Google Maps
          </h2>
          <p className="text-neutral-700">
            Our application uses Google Maps API to display maps and location information. By using our application, 
            you agree to be bound by Google's Terms of Service and Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            7. Changes to This Privacy Policy
          </h2>
          <p className="text-neutral-700">
            We may update our Privacy Policy from time to time. You are advised to review this Privacy Policy 
            periodically for any changes.
          </p>
        </section>
      </div>
    </div>
  );
} 