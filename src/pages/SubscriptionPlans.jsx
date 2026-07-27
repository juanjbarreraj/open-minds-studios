import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Shield, Sparkles } from 'lucide-react';
import SiteHeader from '../components/landing/SiteHeader.jsx';
import { motion } from 'framer-motion';

const tiers = [
  {
    id: 'foundations',
    name: 'Foundation Program',
    tagline: 'Great for getting started',
    icon: Zap,
    theme: {
      headerStrip: 'linear-gradient(135deg, rgb(58,154,202) 0%, rgb(90,180,220) 100%)',
      cardBg: 'linear-gradient(180deg, rgba(58,154,202,0.07) 0%, #ffffff 40%)',
      borderGlow: '0 0 0 1.5px rgba(58,154,202,0.4), 0 10px 25px rgba(0,0,0,0.07)',
      borderGlowHover: '0 0 0 2px rgba(58,154,202,0.7), 0 8px 32px rgba(58,154,202,0.18), 0 20px 40px rgba(0,0,0,0.12)',
      checkColor: 'rgb(58,154,202)',
      checkBg: 'rgba(58,154,202,0.1)',
      btnBg: 'linear-gradient(180deg, rgb(75,165,215) 0%, rgb(50,140,190) 100%)',
      btnGlow: '0 4px 14px rgba(58,154,202,0.4)',
      glowColor: 'rgba(58,154,202,0.2)',
    },
    price: '$200',
    cardMinHeight: '420px',
    outcome: 'Consistent academic support to stay on track.',
    benefits: [
      '1 session per week',
      'Homework help & concept review',
      'Flexible scheduling',
      'Session recap notes',
    ],
  },
  {
    id: 'achiever',
    name: 'Score Boost Program',
    tagline: 'Best value',
    popular: true,
    icon: Sparkles,
    theme: {
      headerStrip: 'linear-gradient(135deg, rgb(80,195,165) 0%, rgb(98,191,161) 50%, rgb(60,180,145) 100%)',
      cardBg: 'linear-gradient(180deg, rgba(98,191,161,0.10) 0%, #ffffff 45%)',
      borderGlow: '0 0 0 2px rgba(98,191,161,0.55), 0 0 20px rgba(98,191,161,0.15), 0 10px 25px rgba(0,0,0,0.07)',
      borderGlowHover: '0 0 0 2px rgba(98,191,161,0.9), 0 0 30px rgba(98,191,161,0.3), 0 20px 50px rgba(98,191,161,0.15)',
      checkColor: 'rgb(98,191,161)',
      checkBg: 'rgba(98,191,161,0.12)',
      btnBg: 'linear-gradient(180deg, rgb(110,205,175) 0%, rgb(78,175,145) 100%)',
      btnGlow: '0 4px 18px rgba(98,191,161,0.5)',
      glowColor: 'rgba(98,191,161,0.25)',
    },
    price: '$390',
    cardMinHeight: '440px',
    outcome: 'Designed to improve test scores and academic performance fast.',
    benefits: [
      '3 sessions per week',
      'Structured SAT / ACT / subject curriculum',
      'Practice tests + strategy sessions',
      'Priority scheduling',
      'Personalized academic planning',
    ],
  },
  {
    id: 'performer',
    name: 'Elite Intensive Program',
    tagline: 'Premium support',
    icon: Shield,
    theme: {
      headerStrip: 'linear-gradient(135deg, rgb(50,130,195) 0%, rgb(70,160,175) 50%, rgb(98,191,161) 100%)',
      cardBg: 'linear-gradient(160deg, rgba(50,100,170,0.07) 0%, rgba(98,191,161,0.06) 60%, #ffffff 100%)',
      borderGlow: '0 0 0 1.5px rgba(70,140,200,0.4), 0 10px 25px rgba(0,0,0,0.07)',
      borderGlowHover: '0 0 0 2px rgba(80,170,180,0.65), 0 8px 32px rgba(70,160,175,0.2), 0 20px 40px rgba(0,0,0,0.13)',
      checkColor: 'rgb(65,145,195)',
      checkBg: 'rgba(65,145,195,0.1)',
      btnBg: 'linear-gradient(135deg, rgb(65,160,210) 0%, rgb(80,185,160) 100%)',
      btnGlow: '0 4px 14px rgba(70,150,190,0.4)',
      glowColor: 'rgba(70,150,190,0.2)',
    },
    price: '$750',
    cardMinHeight: '540px',
    outcome: 'Maximum score improvement in the shortest time.',
    benefits: [
      '7 sessions per week (max 2/day)',
      'Fully customized learning plan',
      'Highest priority scheduling',
      'Direct communication & check-ins',
      'Intensive test prep strategy',
      'Premium dedicated support',
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [btnHovered, setBtnHovered] = useState(null);

  const handleTierClick = (tierName) => {
    navigate(`/contact?program=${encodeURIComponent(tierName)}`);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(98,191,161,0.08) 0%, rgba(58,154,202,0.05) 40%, #f8fafc 70%)',
    }}>
      <SiteHeader />
      {/* Soft background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(58,154,202,0.07) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '-5%', width: '350px', height: '350px',
          background: 'radial-gradient(circle, rgba(98,191,161,0.07) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)',
        }} />
      </div>

      {/* Hero */}
      <motion.div
        className="relative mx-auto max-w-5xl px-6 py-14 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl leading-tight font-bold" style={{
          background: 'linear-gradient(135deg, rgb(30,90,140) 0%, rgb(58,154,202) 45%, rgb(98,191,161) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Choose the Right Monthly Program
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Prefer pay-as-you-go? Sessions are also available at{' '}
          <span className="font-semibold" style={{ color: 'rgb(98,191,161)' }}>$35/hr</span> with no commitment.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="relative mx-auto max-w-5xl px-6 pb-24 grid gap-6 md:grid-cols-3 items-end">
        {tiers.map((tier, i) => {
          const { theme } = tier;
          const isHovered = hovered === tier.id;
          const isDimmed = hovered && hovered !== tier.id;
          const isBtnHovered = btnHovered === tier.id;
          const Icon = tier.icon;

          return (
            <motion.div
              key={tier.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              onMouseEnter={() => setHovered(tier.id)}
              onMouseLeave={() => setHovered(null)}
              className="relative flex flex-col rounded-2xl overflow-hidden"
              style={{
                background: theme.cardBg,
                boxShadow: isHovered ? theme.borderGlowHover : theme.borderGlow,
                minHeight: tier.cardMinHeight,
                transform: isHovered
                  ? `translateY(-8px)${tier.theme.scale ? ' scale(1.02)' : ' scale(1.005)'}`
                  : tier.theme.scale ? 'scale(1.01)' : 'scale(1)',
                opacity: isDimmed ? 0.82 : 1,
                transition: 'all 0.25s ease',
              }}
            >
              {/* Shimmer overlay */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, rgba(98,191,161,0.0) 0%, rgba(58,154,202,0.15) 50%, rgba(98,191,161,0.0) 100%)`,
                  backgroundSize: '200% 200%',
                  animation: 'shimmer 6s ease infinite',
                  zIndex: 0,
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />

              {/* Header strip */}
              <div className="relative px-7 pt-7 pb-6 z-10" style={{ background: theme.headerStrip }}>
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 60%)',
                }} />

                {tier.popular && (
                  <div className="relative z-10 mb-3">
                    <motion.span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: 'rgb(246,178,59)', boxShadow: '0 2px 10px rgba(246,178,59,0.5)' }}
                      animate={{ y: [0, -2, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    >
                      <Star className="h-3 w-3 fill-white" /> Most Popular
                    </motion.span>
                  </div>
                )}

                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-white/70">{tier.tagline}</div>
                    <h2 className="text-xl font-bold text-white leading-tight">{tier.name}</h2>
                  </div>
                </div>
                <div className="mt-4 relative z-10">
                  <span className="text-3xl font-bold text-white">{tier.price}</span>
                  {tier.priceNote && <span className="ml-2 text-sm text-white/70">{tier.priceNote}</span>}
                  <p className="mt-1 text-sm text-white/80 leading-snug">{tier.outcome}</p>
                </div>
              </div>

              {/* Body */}
              <div className={`relative flex flex-col flex-1 px-7 pt-6 z-10 ${tier.id === 'performer' ? 'pb-10' : tier.id === 'achiever' ? 'pb-8' : 'pb-7'}`}>
                <ul className="flex-1 space-y-3 mb-7">
                  {tier.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm">
                      <span
                        className="flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-full"
                        style={{ backgroundColor: theme.checkBg }}
                      >
                        <Check className="h-3 w-3" style={{ color: theme.checkColor }} />
                      </span>
                      <span className="text-slate-600">{b}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={() => setBtnHovered(tier.id)}
                  onMouseLeave={() => setBtnHovered(null)}
                  onClick={() => handleTierClick(tier.name)}
                  className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-white relative overflow-hidden transition-all duration-200"
                  style={{
                    background: theme.btnBg,
                    boxShadow: isHovered ? theme.btnGlow : '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <span className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
                    borderRadius: 'inherit',
                  }} />
                  <span className="relative transition-all duration-200">
                    {isBtnHovered ? 'Free Consultation' : 'Get Started'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="relative text-center pb-10 text-xs text-slate-400">
        All programs are subject to availability. Contact us to get started.
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 200%; }
          50% { background-position: 0% 0%; }
          100% { background-position: 200% 200%; }
        }
      `}</style>
    </div>
  );
}