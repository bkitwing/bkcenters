import { Clock, Sparkles } from 'lucide-react';

interface JoinCourseGuideProps {
  morning: string;
  evening: string;
  custom?: string;
}

/**
 * First-screen instruction: visit during approximate class hours;
 * kindly call the center to confirm before coming.
 */
export default function JoinCourseGuide({ morning, evening, custom }: JoinCourseGuideProps) {
  return (
    <div className="bk-center-hero__join">
      <div className="bk-center-hero__join-kicker">
        <Sparkles className="w-3.5 h-3.5" aria-hidden />
        Learn Rajyoga meditation · free
      </div>
      <p className="bk-center-hero__join-title">Visit during class hours</p>
      {/* A divider can't live inside <p> (invalid HTML the browser rewrites) */}
      <div style={{ marginTop: '0.75rem' }}>
        <hr className="bk-center-hero__join-divider" />
      </div>
      {custom ? (
        <p className="bk-center-hero__join-hours">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {custom}
        </p>
      ) : (
        <div className="bk-center-hero__join-slots">
          <span>
            <Clock className="w-3.5 h-3.5" aria-hidden />
            Morning {morning} <span className="bk-center-hero__join-approx">(approx.)</span>
          </span>
          <span>
            <Clock className="w-3.5 h-3.5" aria-hidden />
            Evening {evening} <span className="bk-center-hero__join-approx">(approx.)</span>
          </span>
        </div>
      )}
      <p className="bk-center-hero__join-note">Open daily. Times can vary — call the center to confirm before you visit.</p>
    </div>
  );
}
