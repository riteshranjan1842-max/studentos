import React, { useState } from 'react';
import { 
  Briefcase, ArrowRight, Check, Search, SlidersHorizontal, ChevronDown, ChevronUp,
  MapPin, Clock, IndianRupee, ExternalLink, X, Sparkles, Award
} from 'lucide-react';
import platformsData from '../data/internshipPlatforms.json';
import domainsData from '../data/internshipDomains.json';

const STIPEND_RANGES = [
  { label: "All Stipends", value: "all" },
  { label: "Unpaid / Free", value: "unpaid" },
  { label: "₹0 – ₹5k", value: "0-5" },
  { label: "₹5k – ₹15k", value: "5-15" },
  { label: "₹15k – ₹30k", value: "15-30" },
  { label: "₹30k+", value: "30" }
];

const DURATIONS = [
  { label: "All Durations", value: "all" },
  { label: "15 Days", value: "15d" },
  { label: "1 Month", value: "1" },
  { label: "2-3 Months", value: "2-3" },
  { label: "3-6 Months", value: "3-6" },
  { label: "6+ Months", value: "6" }
];

const WORK_MODES = [
  { label: "All Modes", value: "all" },
  { label: "Remote", value: "Remote" },
  { label: "On-site", value: "On-site" },
  { label: "Hybrid", value: "Hybrid" }
];

const JOB_TYPES = [
  { label: "All Types", value: "all" },
  { label: "Internship", value: "Internship" },
  { label: "Virtual Internship", value: "Virtual Internship" },
  { label: "Part-time Internship", value: "Part-time Internship" },
  { label: "Full-time Internship", value: "Full-time Internship" }
];

const EXPERIENCE_LEVELS = [
  { label: "All Levels", value: "all" },
  { label: "Fresher/No experience", value: "Fresher/No experience" },
  { label: "Some experience preferred", value: "Some experience preferred" }
];

const START_DATES = [
  { label: "All Start Dates", value: "all" },
  { label: "Immediate", value: "Immediate" },
  { label: "Within 1 month", value: "Within 1 month" },
  { label: "Flexible", value: "Flexible" }
];

const POPULAR_CITIES = [
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Remote"
];

export default function InternshipFinder() {
  const [step, setStep] = useState<number>(1);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Dashboard primary filters
  const [companySearch, setCompanySearch] = useState<string>("");
  const [citySearch, setCitySearch] = useState<string>("");

  // Collapsible Filters
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [workModeFilter, setWorkModeFilter] = useState<string>("all");
  const [stipendFilter, setStipendFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("all");
  const [certificationFilter, setCertificationFilter] = useState<boolean>(false);

  // Skill Tags builder
  const [skillInput, setSkillInput] = useState<string>("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  React.useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Anti-regression check: Warn developers if any Google search URLs are seeded as Careers links
  React.useEffect(() => {
    platformsData.internships.forEach((intern: any) => {
      if (intern.careersUrl?.includes('google.com/search')) {
        console.error(`REGRESSION ERROR: Internship ${intern.id} at ${intern.company} has a Google Search careersUrl.`);
      }
    });
  }, []);

  const [sortBy, setSortBy] = useState<string>("deadline");

  const handleSubDomainToggle = (subDomainLabel: string) => {
    if (selectedDomains.includes(subDomainLabel)) {
      setSelectedDomains(selectedDomains.filter(d => d !== subDomainLabel));
    } else {
      setSelectedDomains([...selectedDomains, subDomainLabel]);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim() !== '') {
      const tag = skillInput.trim();
      if (!skillTags.includes(tag)) {
        setSkillTags([...skillTags, tag]);
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (tag: string) => {
    setSkillTags(skillTags.filter(t => t !== tag));
  };

  // URL Generation helpers
  const getSearchUrl = (platform: string, title: string, company: string) => {
    const config = (platformsData.platforms as Record<string, any>)[platform];
    if (!config) return "https://google.com";
    const queryStr = `${company} ${title}`;
    const formattedQuery = encodeURIComponent(queryStr);
    return `${config.baseUrl}${formattedQuery}${config.suffix || ''}`;
  };

  const getCompanyCareersUrl = (company: string, careersUrl?: string) => {
    // Prevent regression check: reject any google.com search queries
    if (careersUrl && !careersUrl.includes('google.com/search')) {
      return careersUrl;
    }
    // Fall back to known root careers page or homepage, never google.com/search
    const domainPart = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://www.${domainPart}.com/careers`;
  };

  // Filter & Sort listings
  const filteredInternships = platformsData.internships.filter(intern => {
    // 1. Domain filter
    if (selectedDomains.length > 0) {
      const matchDomain = intern.domains.some(d => selectedDomains.includes(d));
      if (!matchDomain) return false;
    }

    // 2. Company Name Search
    if (companySearch.trim() !== "") {
      const compLower = companySearch.toLowerCase();
      if (!intern.company.toLowerCase().includes(compLower)) return false;
    }

    // 3. City Search
    if (citySearch.trim() !== "") {
      const cityLower = citySearch.toLowerCase();
      if (!intern.location.toLowerCase().includes(cityLower)) return false;
    }

    // 4. Job Type
    if (jobTypeFilter !== "all" && intern.jobType !== jobTypeFilter) return false;

    // 5. Work Mode
    if (workModeFilter !== "all" && intern.workMode !== workModeFilter) return false;

    // 6. Stipend range
    if (stipendFilter !== "all") {
      const value = intern.stipendValue;
      if (stipendFilter === "unpaid" && value > 0) return false;
      if (stipendFilter === "0-5" && (value < 0 || value > 5000)) return false;
      if (stipendFilter === "5-15" && (value < 5000 || value > 15000)) return false;
      if (stipendFilter === "15-30" && (value < 15000 || value > 30000)) return false;
      if (stipendFilter === "30" && value < 30000) return false;
    }

    // 7. Duration
    if (durationFilter !== "all" && intern.durationFilter !== durationFilter) return false;

    // 8. Experience Level
    if (experienceFilter !== "all" && intern.experienceLevel !== experienceFilter) return false;

    // 9. Start Date
    if (startDateFilter !== "all" && intern.startDate !== startDateFilter) return false;

    // 10. Certification Required
    if (certificationFilter && !intern.certification) return false;

    // 11. Skill Tags Match
    if (skillTags.length > 0) {
      const hasAllSkills = skillTags.every(tag => 
        intern.skills.some(s => s.toLowerCase().includes(tag.toLowerCase()))
      );
      if (!hasAllSkills) return false;
    }

    return true;
  });

  // Sorting
  const sortedInternships = [...filteredInternships].sort((a, b) => {
    if (sortBy === "deadline") {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === "posted") {
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    }
    if (sortBy === "stipend") {
      return b.stipendValue - a.stipendValue;
    }
    return 0;
  });

  // Calculate selections per category
  const getSelectedCountForCategory = (subDomains: any[]) => {
    return subDomains.filter(sub => selectedDomains.includes(sub.label)).length;
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Step 1: Domain Selection */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-3">
              <Briefcase className="w-8 h-8 text-emerald-400" /> Let's Find Your Internship
            </h1>
            <p className="text-slate-400 text-sm">
              Click a broad category to expand and select specific sub-domains. You can choose options across multiple areas.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4">
            {Object.entries(domainsData).map(([key, cat]) => {
              const isExpanded = expandedCategory === key;
              const selectedCount = getSelectedCountForCategory(cat.subDomains);
              return (
                <div key={key} className="flex flex-col space-y-2">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : key)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 group relative flex flex-col justify-between h-28 ${
                      isExpanded
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : selectedCount > 0
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : 'border-ink-800/80 bg-ink-900/40 hover:bg-ink-800/30 hover:border-ink-700/50'
                    }`}
                  >
                    <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {cat.label}
                    </span>
                    <div className="flex justify-between items-center w-full mt-2">
                      <span className="text-[10px] text-slate-500">
                        {cat.subDomains.length} sub-domains
                      </span>
                      {selectedCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold shadow-sm">
                          {selectedCount} Selected
                        </span>
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-ink-850 flex items-center justify-center text-slate-500 group-hover:text-white transition-all">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Subdomains Panel (Accordion Style matching Concept Study) */}
          {expandedCategory && (() => {
            const activeCategory = (domainsData as Record<string, any>)[expandedCategory];
            return (
              <div 
                className="max-w-4xl mx-auto mt-4 p-5 rounded-2xl border border-ink-700/60 bg-ink-950/80 backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div>
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Select Specific Sub-Domains</h4>
                  <h3 className="text-base font-bold text-white mt-0.5">{activeCategory.label}</h3>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {activeCategory.subDomains.map((sub: any) => {
                    const isSelected = selectedDomains.includes(sub.label);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubDomainToggle(sub.label)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                            : 'bg-ink-900 border-ink-800 text-slate-400 hover:text-white hover:bg-ink-800/40'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Continue bar */}
          <div className="flex flex-col items-center justify-center pt-6 space-y-2">
            <button
              onClick={() => setStep(2)}
              disabled={selectedDomains.length === 0}
              className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all relative ${
                selectedDomains.length > 0
                  ? 'bg-emerald-500 text-white hover:bg-emerald-450 shadow-lg shadow-emerald-500/20'
                  : 'bg-ink-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Find Internships <ArrowRight className="w-4 h-4" />
              {selectedDomains.length > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 px-1.5 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-extrabold shadow-md min-w-[20px]">
                  {selectedDomains.length}
                </span>
              )}
            </button>
            <p className="text-[10px] text-slate-500">
              *Select at least one specific sub-domain chip to proceed
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Main Internship Finder Dashboard */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top Info Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-800/40 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Briefcase className="w-7 h-7 text-emerald-400" /> Search Across Platforms
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                View direct careers page searches and matches for Unstop, Internshala, LinkedIn, Naukri, Indeed, Turing, and more.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedDomains([]);
                setStep(1);
              }}
              className="px-4 py-2 rounded-xl bg-ink-900/60 hover:bg-ink-800/50 text-xs font-semibold text-slate-400 hover:text-white border border-ink-800/80 transition-all"
            >
              Reset Domains
            </button>
          </div>

          {/* Active Domains Tag bar */}
          {selectedDomains.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Searching in:</span>
              {selectedDomains.map(d => (
                <span 
                  key={d} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/15"
                >
                  {d}
                  <button onClick={() => handleSubDomainToggle(d)}>
                    <X className="w-3 h-3 text-emerald-500 hover:text-white" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Primary Filters & Expandable Panel */}
          <div className="glass border border-ink-800/85 p-5 rounded-2xl bg-ink-950/20 space-y-4">
            
            {/* Primary Search Row: Domain / Company / Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Search company (e.g. Google)"
                    className="w-full text-xs bg-ink-900 border border-ink-800 rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-655 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* City Search */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location / City</label>
                <div className="relative">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Enter city (e.g. Mumbai)"
                    className="w-full text-xs bg-ink-900 border border-ink-800 rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-655 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Quick Picks */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Popular Cities</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {POPULAR_CITIES.map(city => (
                    <button
                      key={city}
                      onClick={() => setCitySearch(city === 'Remote' ? 'Remote' : city)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-all border ${
                        citySearch === city
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-ink-900 border-ink-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Collapsible Trigger */}
            <div className="flex justify-center border-t border-ink-800/40 pt-3.5">
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-350 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> 
                {showMoreFilters ? 'Hide Additional Filters' : 'Show Additional Filters'}
                {showMoreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Hidden filter container */}
            {showMoreFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-t border-ink-800/40 pt-4 animate-in fade-in duration-200">
                {/* Job Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Type</label>
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="w-full text-xs bg-ink-900 border border-ink-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    {JOB_TYPES.map(j => (
                      <option key={j.value} value={j.value}>{j.label}</option>
                    ))}
                  </select>
                </div>

                {/* Work Mode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Mode</label>
                  <select
                    value={workModeFilter}
                    onChange={(e) => setWorkModeFilter(e.target.value)}
                    className="w-full text-xs bg-ink-900 border border-ink-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    {WORK_MODES.map(w => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>

                {/* Stipend */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stipend Range</label>
                  <select
                    value={stipendFilter}
                    onChange={(e) => setStipendFilter(e.target.value)}
                    className="w-full text-xs bg-ink-900 border border-ink-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    {STIPEND_RANGES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</label>
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                    className="w-full text-xs bg-ink-900 border border-ink-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    {DURATIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience Level</label>
                  <select
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="w-full text-xs bg-ink-900 border border-ink-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    {EXPERIENCE_LEVELS.map(x => (
                      <option key={x.value} value={x.value}>{x.label}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                  <select
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full text-xs bg-ink-900 border border-ink-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    {START_DATES.map(sd => (
                      <option key={sd.value} value={sd.value}>{sd.label}</option>
                    ))}
                  </select>
                </div>

                {/* Certification Included */}
                <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={certificationFilter}
                      onChange={(e) => setCertificationFilter(e.target.checked)}
                      className="rounded border-ink-700 bg-ink-900 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">
                      Certification Included
                    </span>
                  </label>
                </div>

                {/* Skills Keyword Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills / Keywords</label>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Type and press Enter"
                    className="w-full text-xs bg-ink-900 border border-ink-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>

                {/* Skill tag list rendering */}
                {skillTags.length > 0 && (
                  <div className="col-span-1 sm:col-span-2 md:col-span-4 flex flex-wrap gap-1.5 pt-1.5">
                    {skillTags.map(tag => (
                      <span 
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-ink-800 border border-ink-700 text-[10px] font-bold text-slate-300"
                      >
                        {tag}
                        <button onClick={() => handleRemoveSkill(tag)}>
                          <X className="w-3 h-3 text-slate-500 hover:text-white" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sorting and Summary row */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-3 border-t border-ink-800/40">
              <div className="text-[11px] text-slate-500 font-semibold">
                Found {sortedInternships.length} matching opportunities
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs bg-ink-900 border border-ink-800 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="deadline">Deadline (soonest)</option>
                  <option value="posted">Recently Posted</option>
                  <option value="stipend">Stipend (high to low)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Results Grid */}
          {sortedInternships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedInternships.map(intern => (
                <div 
                  key={intern.id}
                  className="glass border border-ink-800/80 rounded-2xl bg-ink-900/10 p-5 hover:bg-ink-850/10 hover:border-emerald-500/20 transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Card Header */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-base leading-snug">{intern.title}</h3>
                          {intern.certification && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider">
                              <Award className="w-2.5 h-2.5" /> ✓ Certified
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-emerald-400">{intern.company}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                        intern.workMode === 'Remote' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                          : intern.workMode === 'Hybrid'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                      }`}>
                        {intern.workMode}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-slate-400 text-[11px] pt-1">
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-500" /> {intern.stipendText}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {intern.durationText}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" /> {intern.location}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {intern.jobType}
                      </span>
                    </div>

                    {/* Render matching skill indicators */}
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {intern.skills.map(skill => (
                        <span 
                          key={skill}
                          className="px-2 py-0.5 rounded bg-ink-950 text-[10px] text-slate-500 font-semibold border border-ink-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: Platforms Badges and View & Apply */}
                  {(() => {
                    const sources = [
                      ...intern.platforms.map(platform => ({
                        platform,
                        url: getSearchUrl(platform, intern.title, intern.company)
                      })),
                      {
                        platform: "Careers",
                        url: getCompanyCareersUrl(intern.company, (intern as any).careersUrl)
                      }
                    ];

                    return (
                      <div className="pt-3 border-t border-ink-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        {/* Platform badges matching grouping */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Available on:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {sources.map(src => (
                              <a 
                                key={src.platform}
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                  src.platform === 'Careers'
                                    ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/15 hover:text-white'
                                    : 'bg-ink-800 text-slate-300 border-ink-700/50 hover:bg-emerald-500/15 hover:text-white'
                                }`}
                              >
                                {src.platform} 
                                {src.platform === 'Careers' ? (
                                  <Sparkles className="w-2.5 h-2.5" />
                                ) : (
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                                )}
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* Apply Button & Popover */}
                        <div className="relative shrink-0 w-full sm:w-auto">
                          {sources.length === 1 ? (
                            <a
                              href={sources[0].url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-xs font-bold text-white text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                            >
                              Apply <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === intern.id ? null : intern.id);
                                }}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-xs font-bold text-white text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                              >
                                Apply <ChevronDown className="w-3 h-3" />
                              </button>
                              {openDropdownId === intern.id && (
                                <div className="absolute right-0 bottom-full mb-2 w-48 rounded-xl border border-ink-800 bg-ink-950 p-1.5 shadow-xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                  <div className="px-2.5 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-ink-900 mb-1">
                                    Apply via:
                                  </div>
                                  {sources.map(src => (
                                    <a
                                      key={src.platform}
                                      href={src.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={() => setOpenDropdownId(null)}
                                      className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-emerald-500/10 transition-all font-semibold"
                                    >
                                      {src.platform}
                                      {src.platform === 'Careers' ? (
                                        <Sparkles className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <ExternalLink className="w-3 h-3 text-slate-500" />
                                      )}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass border border-ink-800/60 p-12 rounded-2xl bg-ink-900/10 text-center space-y-3">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No internships found matching your filters</h3>
              <p className="text-xs text-slate-550 max-w-sm mx-auto">
                Try selecting more domains, relaxing your filters, or clearing your search fields.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
