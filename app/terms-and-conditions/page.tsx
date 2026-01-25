import type { Metadata } from "next";
import { getMetadataBase } from "@/lib/ogUtils";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Terms and Conditions - Brahma Kumaris Meditation Center Locator";
  const description = "Terms and Conditions for the Brahma Kumaris Meditation Center Locator Application. Read our terms of use, intellectual property rights, and user guidelines.";
  const canonicalUrl = 'https://www.brahmakumaris.com/centers/terms-and-conditions';

  return {
    metadataBase: getMetadataBase(),
    title,
    description,
    keywords: "Brahma Kumaris, terms and conditions, terms of use, meditation center locator, user agreement",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-spirit-purple-800 mb-6">
          Terms and Conditions for Brahma Kumaris Meditation Center Locator App
        </h1>
        
        <p className="text-neutral-500 mb-6">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            1. Introduction
          </h2>
          <p className="text-neutral-700">
            These Terms and Conditions ("Terms") govern your use of the Brahma Kumaris Meditation Center Locator web application ("the Application"). 
            By accessing or using the Application, you agree to be bound by these Terms. 
            If you disagree with any part of the Terms, you may not access the Application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            2. Definitions
          </h2>
          <ul className="list-disc pl-6 text-neutral-700">
            <li className="mb-2"><strong>"Application"</strong> refers to the Brahma Kumaris Meditation Center Locator web application.</li>
            <li className="mb-2"><strong>"User," "You," and "Your"</strong> refer to the individual accessing or using the Application.</li>
            <li className="mb-2"><strong>"We," "Us," and "Our"</strong> refer to the Brahma Kumaris organization.</li>
            <li className="mb-2"><strong>"Content"</strong> refers to all information, text, graphics, photos, videos, and other materials available on the Application.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            3. User Account
          </h2>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              3.1. Account Registration
            </h3>
            <p className="text-neutral-700">
              The Application does not require account creation to access basic features. 
              However, certain features may require you to provide personal information through contact forms.
            </p>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              3.2. Information Accuracy
            </h3>
            <p className="text-neutral-700">
              You agree to provide accurate, current, and complete information when filling out any form on the Application 
              and to update such information to keep it accurate, current, and complete.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            4. Acceptable Use
          </h2>
          <p className="text-neutral-700 mb-4">
            You agree to use the Application only for lawful purposes and in a way that does not infringe the rights of, 
            restrict, or inhibit anyone else's use and enjoyment of the Application. Prohibited behavior includes:
          </p>
          <ul className="list-disc pl-6 text-neutral-700">
            <li className="mb-1">Using the Application in any way that breaches any applicable local, national, or international law or regulation</li>
            <li className="mb-1">Using the Application to send unsolicited communications</li>
            <li className="mb-1">Attempting to gain unauthorized access to our servers or other computer systems</li>
            <li className="mb-1">Transmitting any material that contains viruses, Trojan horses, worms, or any other harmful programs</li>
            <li className="mb-1">Scraping, data-mining, or otherwise collecting information from the Application without our prior written consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            5. Intellectual Property Rights
          </h2>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              5.1. Our Content
            </h3>
            <p className="text-neutral-700">
              All Content on the Application, including but not limited to text, graphics, logos, icons, images, audio clips, 
              digital downloads, and data compilations, is the property of Brahma Kumaris or its content suppliers 
              and is protected by international copyright laws.
            </p>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              5.2. Your Use of Our Content
            </h3>
            <p className="text-neutral-700 mb-2">
              We grant you a limited license to access and use the Application and to download or print a copy of any portion of the Content 
              to which you have properly gained access, solely for your personal, non-commercial use. You may not:
            </p>
            <ul className="list-disc pl-6 text-neutral-700">
              <li className="mb-1">Modify or copy the materials</li>
              <li className="mb-1">Use the materials for any commercial purpose</li>
              <li className="mb-1">Attempt to decompile or reverse engineer any software contained on the Application</li>
              <li className="mb-1">Remove any copyright or other proprietary notations from the materials</li>
              <li className="mb-1">Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            6. User Content
          </h2>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              6.1. User Submissions
            </h3>
            <p className="text-neutral-700">
              When you submit information through contact forms or other interactive features, you grant us a worldwide, 
              royalty-free, perpetual, irrevocable, non-exclusive license to use, reproduce, modify, adapt, publish, translate, 
              create derivative works from, distribute, and display such content.
            </p>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              6.2. Content Restrictions
            </h3>
            <p className="text-neutral-700 mb-2">
              You agree not to submit content that:
            </p>
            <ul className="list-disc pl-6 text-neutral-700">
              <li className="mb-1">Is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy</li>
              <li className="mb-1">Infringes any patent, trademark, trade secret, copyright, or other intellectual property rights</li>
              <li className="mb-1">Contains software viruses or any other computer code designed to interfere with the functionality of the Application</li>
              <li className="mb-1">Impersonates any person or entity or falsely states or misrepresents your affiliation with a person or entity</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            7. Third-Party Services and Links
          </h2>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              7.1. Third-Party Services
            </h3>
            <p className="text-neutral-700">
              The Application may display, include, or make available third-party content or provide links to third-party websites or services. 
              We do not control, endorse, or assume responsibility for any third-party content or services.
            </p>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-medium text-spirit-purple-600 mb-2">
              7.2. Google Maps
            </h3>
            <p className="text-neutral-700">
              The Application uses Google Maps API. By using the Application, you agree to be bound by Google's Terms of Service.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            8. Disclaimer of Warranties
          </h2>
          <p className="text-neutral-700">
            THE APPLICATION AND ALL INFORMATION, CONTENT, MATERIALS, AND SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE 
            TO YOU THROUGH THE APPLICATION ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, UNLESS OTHERWISE SPECIFIED IN WRITING. 
            WE MAKE NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE APPLICATION OR 
            THE INFORMATION, CONTENT, MATERIALS, OR SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THE APPLICATION.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            9. Indemnification
          </h2>
          <p className="text-neutral-700">
            You agree to defend, indemnify, and hold us harmless from and against any claims, liabilities, damages, losses, and expenses, 
            including, without limitation, reasonable legal and accounting fees, arising out of or in any way connected with your access 
            to or use of the Application or your violation of these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            10. Changes to Terms
          </h2>
          <p className="text-neutral-700">
            We reserve the right to modify or replace these Terms at any time. We will provide notice of any changes by posting 
            the new Terms on the Application. Your continued use of the Application after any such changes constitutes your acceptance of the new Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-spirit-purple-700 mb-4">
            11. Governing Law
          </h2>
          <p className="text-neutral-700">
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>
        </section>
      </div>
    </div>
  );
} 