// Clean implementation pattern for collapsible sections
// Based on the working Source Countries section

// 1. State variables (already added):
const [basicInfoExpanded, setBasicInfoExpanded] = useState(true);
const [locationExpanded, setLocationExpanded] = useState(true);
const [contactsExpanded, setContactsExpanded] = useState(true);
const [specialtiesExpanded, setSpecialtiesExpanded] = useState(true);
const [settingsExpanded, setSettingsExpanded] = useState(true);
const [hoursExpanded, setHoursExpanded] = useState(true);
const [imagesExpanded, setImagesExpanded] = useState(true);

// 2. Section Header Pattern (exact copy from Source Countries):
<div className="flex justify-between items-center">
  <h3 className="text-xl font-semibold text-gray-800 select-none">
    {t('section.title', 'Section Title')}
  </h3>
  <button
    type="button"
    onClick={() => setSectionExpanded(!sectionExpanded)}
    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
    title={sectionExpanded ? 'Collapse section' : 'Expand section'}
  >
    <svg 
      className="w-4 h-4 transition-transform duration-200" 
      style={{ transform: sectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
</div>

// 3. Conditional Content Pattern:
{sectionExpanded && (
  <>
    {/* All section content goes here */}
  </>
)}

// This pattern creates a professional collapsible interface with:
// ✨ Smooth chevron animation (180° rotation)
// 🎨 Professional hover states
// 🔄 Consistent styling across all sections
// 📱 Responsive design