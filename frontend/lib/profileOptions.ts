// All dropdown options for profile fields

import { buildHeightOptions } from '@/lib/utils';

export type SelectOption = { value: string; label: string };

// ─── Profile Created By ───────────────────────────────────────────────────────
export const profileCreatedByOptions: SelectOption[] = [
    { value: 'self', label: 'Self' },
    { value: 'parents', label: 'Parents / Guardian' },
    { value: 'siblings', label: 'Sibling' },
    { value: 'relative', label: 'Relative' },
    { value: 'friend', label: 'Friend' },
    { value: 'other', label: 'Other' },
];

// ─── Profile Created For ──────────────────────────────────────────────────────
export const profileCreatedForOptions: SelectOption[] = [
    { value: 'self', label: 'Self' },
    { value: 'son', label: 'Son' },
    { value: 'daughter', label: 'Daughter' },
    { value: 'brother', label: 'Brother' },
    { value: 'sister', label: 'Sister' },
    { value: 'relative', label: 'Relative' },
];

// ─── Looking For ─────────────────────────────────────────────────────────────
export const lookingForOptions: SelectOption[] = [
    { value: 'bride', label: 'Bride (Female)' },
    { value: 'groom', label: 'Groom (Male)' },
];

// ─── Marital Status ───────────────────────────────────────────────────────────
export const maritalStatusOptions: SelectOption[] = [
    { value: 'never_married', label: 'Never Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'awaiting_divorce', label: 'Awaiting Divorce' },
];

// ─── Have Children ────────────────────────────────────────────────────────────
export const haveChildrenOptions: SelectOption[] = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: 'Yes' },
];

// ─── Child Living Status ──────────────────────────────────────────────────────
export const childLivingStatusOptions: SelectOption[] = [
    { value: 'no_child', label: 'No Child' },
    { value: 'child_living_with_me', label: 'Child Living With Me' },
    { value: 'child_not_living_with_me', label: 'Child Not Living With Me' },
];

// ─── Age (years) ─────────────────────────────────────────────────────────────
export const ageOptions: SelectOption[] = Array.from({ length: 83 }, (_, i) => {
    const age = 18 + i;
    return { value: String(age), label: `${age} years` };
});

// ─── Annual income brackets (BDT) ────────────────────────────────────────────
export const incomeOptions: SelectOption[] = [
    { value: '100000', label: '1 Lakh+' },
    { value: '300000', label: '3 Lakh+' },
    { value: '500000', label: '5 Lakh+' },
    { value: '1000000', label: '10 Lakh+' },
    { value: '2000000', label: '20 Lakh+' },
    { value: '5000000', label: '50 Lakh+' },
    { value: '10000000', label: '1 Crore+' },
];

// ─── Height (cm) — one option per ft/in bucket (max cm in group) ─────────────
export const heightOptions: SelectOption[] = buildHeightOptions();

// ─── Weight (kg) ─────────────────────────────────────────────────────────────
export const weightOptions: SelectOption[] = Array.from({ length: 121 }, (_, i) => {
    const kg = 40 + i;
    return { value: String(kg), label: `${kg} kg` };
});

// ─── Body Type ────────────────────────────────────────────────────────────────
export const bodyTypeOptions: SelectOption[] = [
    { value: 'slim', label: 'Slim' },
    { value: 'average', label: 'Average' },
    { value: 'athletic', label: 'Athletic / Fit' },
    { value: 'heavy', label: 'Heavy / Overweight' },
];

// ─── Eye Color ────────────────────────────────────────────────────────────────
export const eyeColorOptions: SelectOption[] = [
    { value: 'black', label: 'Black' },
    { value: 'dark_brown', label: 'Dark Brown' },
    { value: 'brown', label: 'Brown' },
    { value: 'hazel', label: 'Hazel' },
    { value: 'grey', label: 'Grey' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
];

// ─── Hair Color ───────────────────────────────────────────────────────────────
export const hairColorOptions: SelectOption[] = [
    { value: 'black', label: 'Black' },
    { value: 'dark_brown', label: 'Dark Brown' },
    { value: 'brown', label: 'Brown' },
    { value: 'blonde', label: 'Blonde' },
    { value: 'red', label: 'Red' },
    { value: 'grey', label: 'Grey' },
    { value: 'white', label: 'White' },
];

// ─── Complexion ───────────────────────────────────────────────────────────────
export const complexionOptions: SelectOption[] = [
    { value: 'very_fair', label: 'Very Fair' },
    { value: 'fair', label: 'Fair' },
    { value: 'wheatish', label: 'Wheatish / Medium' },
    { value: 'dark', label: 'Dark' },
];

// ─── Blood Group ─────────────────────────────────────────────────────────────
export const bloodGroupOptions: SelectOption[] = [
    'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-',
].map(bg => ({ value: bg, label: bg }));

// ─── Disability ───────────────────────────────────────────────────────────────
export const disabilityOptions: SelectOption[] = [
    { value: 'none', label: 'None' },
    { value: 'visual', label: 'Visual Impairment' },
    { value: 'hearing', label: 'Hearing Impairment' },
    { value: 'physical', label: 'Physical Disability' },
    { value: 'speech', label: 'Speech Impairment' },
    { value: 'other', label: 'Other' },
];

// ─── Smoking ──────────────────────────────────────────────────────────────────
export const smokingOptions: SelectOption[] = [
    { value: 'non_smoker', label: 'No' },
    { value: 'smoker', label: 'Yes' },
    { value: 'occasionally', label: 'Occasionally' },
];

// ─── Drinking ─────────────────────────────────────────────────────────────────
export const drinkingOptions: SelectOption[] = [
    { value: 'non_drinker', label: 'No' },
    { value: 'drinker', label: 'Yes' },
    { value: 'occasionally', label: 'Occasionally' },
];

// ─── Religion ─────────────────────────────────────────────────────────────────
export const religionOptions: SelectOption[] = [
    { value: 'islam', label: 'Islam' },
    { value: 'hinduism', label: 'Hinduism' },
    { value: 'buddhism', label: 'Buddhism' },
    { value: 'christianity', label: 'Christianity' },
    { value: 'sikhism', label: 'Sikhism' },
    { value: 'jainism', label: 'Jainism' },
    { value: 'judaism', label: 'Judaism' },
    { value: 'other', label: 'Other' },
];

// ─── Caste by Religion ────────────────────────────────────────────────────────
export const casteOptions: Record<string, SelectOption[]> = {
    islam: [
        { value: 'sunni', label: 'Sunni' },
        { value: 'shia', label: 'Shia' },
        { value: 'ahmadiyya', label: 'Ahmadiyya' },
        { value: 'other', label: 'Other' },
    ],
    hinduism: [
        { value: 'brahmin', label: 'Brahmin' },
        { value: 'kshatriya', label: 'Kshatriya' },
        { value: 'vaishya', label: 'Vaishya' },
        { value: 'shudra', label: 'Shudra' },
        { value: 'kayastha', label: 'Kayastha' },
        { value: 'varna_other', label: 'Other' },
    ],
    buddhism: [
        { value: 'theravada', label: 'Theravada' },
        { value: 'mahayana', label: 'Mahayana' },
        { value: 'other', label: 'Other' },
    ],
    christianity: [
        { value: 'catholic', label: 'Catholic' },
        { value: 'protestant', label: 'Protestant' },
        { value: 'orthodox', label: 'Orthodox' },
        { value: 'other', label: 'Other' },
    ],
    default: [
        { value: 'other', label: 'Other' },
    ],
};

export const getCasteOptions = (religion: string): SelectOption[] =>
    casteOptions[religion] ?? casteOptions.default;

// ─── Religiousness ────────────────────────────────────────────────────────────
export const religiousnessOptions: SelectOption[] = [
    { value: 'very_religious', label: 'Very Religious' },
    { value: 'religious', label: 'Religious' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'not_religious', label: 'Not Religious' },
];

// ─── Pray ─────────────────────────────────────────────────────────────────────
export const prayOptions: SelectOption[] = [
    { value: 'always', label: 'Always' },
    { value: 'usually', label: 'Usually' },
    { value: 'sometimes', label: 'Sometimes' },
    { value: 'rarely', label: 'Rarely' },
    { value: 'never', label: 'Never' },
];

// ─── Mother Tongue ────────────────────────────────────────────────────────────
export const motherTongueOptions: SelectOption[] = [
    { value: 'bengali', label: 'Bengali (Bangla)' },
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'urdu', label: 'Urdu' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'punjabi', label: 'Punjabi' },
    { value: 'tamil', label: 'Tamil' },
    { value: 'telugu', label: 'Telugu' },
    { value: 'marathi', label: 'Marathi' },
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'kannada', label: 'Kannada' },
    { value: 'malayalam', label: 'Malayalam' },
    { value: 'odia', label: 'Odia' },
    { value: 'assamese', label: 'Assamese' },
    { value: 'sindhi', label: 'Sindhi' },
    { value: 'nepali', label: 'Nepali' },
    { value: 'sinhala', label: 'Sinhala' },
    { value: 'burmese', label: 'Burmese' },
    { value: 'other', label: 'Other' },
];

// ─── Family Values ────────────────────────────────────────────────────────────
export const familyValuesOptions: SelectOption[] = [
    { value: 'traditional', label: 'Traditional' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'liberal', label: 'Liberal' },
    { value: 'religious', label: 'Religious' },
];

// ─── Occupation ───────────────────────────────────────────────────────────────
export const occupationOptions: SelectOption[] = [
    { value: 'business', label: 'Business / Entrepreneur' },
    { value: 'government_service', label: 'Government Service' },
    { value: 'private_service', label: 'Private Service' },
    { value: 'defense', label: 'Defense / Military' },
    { value: 'doctor', label: 'Doctor / Medical' },
    { value: 'engineer', label: 'Engineer' },
    { value: 'teacher', label: 'Teacher / Professor' },
    { value: 'lawyer', label: 'Lawyer / Advocate' },
    { value: 'it_professional', label: 'IT Professional' },
    { value: 'banker', label: 'Banker / Finance' },
    { value: 'journalist', label: 'Journalist / Media' },
    { value: 'artist', label: 'Artist / Creative' },
    { value: 'farmer', label: 'Farmer / Agriculture' },
    { value: 'skilled_worker', label: 'Skilled Worker' },
    { value: 'student', label: 'Student' },
    { value: 'retired', label: 'Retired' },
    { value: 'homemaker', label: 'Homemaker' },
    { value: 'not_working', label: 'Not Working' },
    { value: 'other', label: 'Other' },
];

// ─── Profession (self) ────────────────────────────────────────────────────────
export const professionOptions: SelectOption[] = [
    { value: 'doctor_physician', label: 'Doctor / Physician' },
    { value: 'dentist', label: 'Dentist' },
    { value: 'nurse', label: 'Nurse / Paramedic' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'software_engineer', label: 'Software Engineer' },
    { value: 'hardware_engineer', label: 'Hardware Engineer' },
    { value: 'data_scientist', label: 'Data Scientist / AI' },
    { value: 'civil_engineer', label: 'Civil Engineer' },
    { value: 'electrical_engineer', label: 'Electrical Engineer' },
    { value: 'mechanical_engineer', label: 'Mechanical Engineer' },
    { value: 'architect', label: 'Architect' },
    { value: 'teacher_professor', label: 'Teacher / Professor' },
    { value: 'lawyer', label: 'Lawyer / Advocate' },
    { value: 'accountant', label: 'Accountant / CA' },
    { value: 'banker', label: 'Banker' },
    { value: 'financial_analyst', label: 'Financial Analyst' },
    { value: 'marketing_professional', label: 'Marketing Professional' },
    { value: 'hr_professional', label: 'HR Professional' },
    { value: 'journalist', label: 'Journalist / Media' },
    { value: 'government_officer', label: 'Government Officer' },
    { value: 'defense_forces', label: 'Defense / Military' },
    { value: 'police', label: 'Police / Law Enforcement' },
    { value: 'businessman', label: 'Businessman / Entrepreneur' },
    { value: 'artist_designer', label: 'Artist / Designer' },
    { value: 'fashion_designer', label: 'Fashion Designer' },
    { value: 'chef_cook', label: 'Chef / Cook' },
    { value: 'pilot', label: 'Pilot' },
    { value: 'sailor', label: 'Sailor / Navy' },
    { value: 'student', label: 'Student' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'farmer', label: 'Farmer' },
    { value: 'driver', label: 'Driver' },
    { value: 'skilled_worker', label: 'Skilled Worker' },
    { value: 'homemaker', label: 'Homemaker' },
    { value: 'not_working', label: 'Not Working' },
    { value: 'other', label: 'Other' },
];

// ─── Education Level ─────────────────────────────────────────────────────────
export const educationLevelOptions: SelectOption[] = [
    { value: 'below_ssc', label: 'Below SSC / Secondary' },
    { value: 'ssc', label: 'SSC / Secondary School Certificate' },
    { value: 'hsc', label: 'HSC / Higher Secondary Certificate' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'bachelors', label: 'Bachelors / Graduate' },
    { value: 'masters', label: 'Masters / Post Graduate' },
    { value: 'phd', label: 'PhD / Doctorate' },
    { value: 'postdoctoral', label: 'Post Doctoral' },
];

// ─── Employed In ─────────────────────────────────────────────────────────────
export const employedInOptions: SelectOption[] = [
    { value: 'private', label: 'Private Sector' },
    { value: 'government', label: 'Government' },
    { value: 'business', label: 'Business / Self-Owned' },
    { value: 'self_employed', label: 'Self-Employed / Freelance' },
    { value: 'not_working', label: 'Not Working' },
];

// ─── Experience ───────────────────────────────────────────────────────────────
export const experienceOptions: SelectOption[] = [
    { value: '0', label: 'Fresher / Less than 1 year' },
    ...Array.from({ length: 30 }, (_, i) => {
        const yr = i + 1;
        return { value: String(yr), label: `${yr} Year${yr > 1 ? 's' : ''}` };
    }),
];

// ─── Diet ─────────────────────────────────────────────────────────────────────
export const dietOptions: SelectOption[] = [
    { value: 'non_vegetarian', label: 'Non-Vegetarian' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'jain', label: 'Jain' },
];

// ─── Eye-Wear ─────────────────────────────────────────────────────────────────
export const eyeWearOptions: SelectOption[] = [
    { value: 'none', label: 'None' },
    { value: 'glasses', label: 'Glasses / Spectacles' },
    { value: 'contact_lens', label: 'Contact Lens' },
];

// ─── Hobbies ─────────────────────────────────────────────────────────────────
export const hobbiesOptions: SelectOption[] = [
    { value: 'reading', label: 'Reading' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'traveling', label: 'Traveling' },
    { value: 'music', label: 'Music / Singing' },
    { value: 'movies', label: 'Movies / Web Series' },
    { value: 'sports', label: 'Sports / Fitness' },
    { value: 'photography', label: 'Photography' },
    { value: 'gardening', label: 'Gardening' },
    { value: 'art_craft', label: 'Art & Craft' },
    { value: 'dancing', label: 'Dancing' },
    { value: 'writing', label: 'Writing / Blogging' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'volunteering', label: 'Volunteering' },
    { value: 'yoga_meditation', label: 'Yoga / Meditation' },
    { value: 'cycling', label: 'Cycling' },
    { value: 'swimming', label: 'Swimming' },
    { value: 'fishing', label: 'Fishing' },
    { value: 'cricket', label: 'Cricket' },
    { value: 'football', label: 'Football' },
    { value: 'badminton', label: 'Badminton' },
];

// ─── Nationality (retired) ────────────────────────────────────────────────────
// export const nationalityOptions: SelectOption[] = [
//     { value: 'bangladeshi', label: 'Bangladeshi' },
//     { value: 'indian', label: 'Indian' },
//     { value: 'pakistani', label: 'Pakistani' },
//     { value: 'sri_lankan', label: 'Sri Lankan' },
//     { value: 'nepali', label: 'Nepali' },
//     { value: 'british', label: 'British' },
//     { value: 'american', label: 'American' },
//     { value: 'canadian', label: 'Canadian' },
//     { value: 'australian', label: 'Australian' },
//     { value: 'german', label: 'German' },
//     { value: 'french', label: 'French' },
//     { value: 'italian', label: 'Italian' },
//     { value: 'other', label: 'Other' },
// ];

// ─── Countries ────────────────────────────────────────────────────────────────
export const countryOptions: SelectOption[] = [
    { value: 'bangladesh', label: 'Bangladesh' },
    { value: 'india', label: 'India' },
    { value: 'pakistan', label: 'Pakistan' },
    { value: 'united_kingdom', label: 'United Kingdom' },
    { value: 'united_states', label: 'United States' },
    { value: 'canada', label: 'Canada' },
    { value: 'australia', label: 'Australia' },
    { value: 'germany', label: 'Germany' },
    { value: 'france', label: 'France' },
    { value: 'italy', label: 'Italy' },
    { value: 'spain', label: 'Spain' },
    { value: 'netherlands', label: 'Netherlands' },
    { value: 'sweden', label: 'Sweden' },
    { value: 'norway', label: 'Norway' },
    { value: 'denmark', label: 'Denmark' },
    { value: 'finland', label: 'Finland' },
    { value: 'switzerland', label: 'Switzerland' },
    { value: 'austria', label: 'Austria' },
    { value: 'belgium', label: 'Belgium' },
    { value: 'portugal', label: 'Portugal' },
    { value: 'greece', label: 'Greece' },
    { value: 'uae', label: 'UAE (United Arab Emirates)' },
    { value: 'saudi_arabia', label: 'Saudi Arabia' },
    { value: 'qatar', label: 'Qatar' },
    { value: 'kuwait', label: 'Kuwait' },
    { value: 'oman', label: 'Oman' },
    { value: 'bahrain', label: 'Bahrain' },
    { value: 'malaysia', label: 'Malaysia' },
    { value: 'singapore', label: 'Singapore' },
    { value: 'japan', label: 'Japan' },
    { value: 'south_korea', label: 'South Korea' },
    { value: 'china', label: 'China' },
    { value: 'sri_lanka', label: 'Sri Lanka' },
    { value: 'nepal', label: 'Nepal' },
    { value: 'new_zealand', label: 'New Zealand' },
    { value: 'south_africa', label: 'South Africa' },
    { value: 'other', label: 'Other' },
];

// ─── Bangladesh Divisions/Cities ──────────────────────────────────────────────
export const bangladeshDivisions: SelectOption[] = [
    { value: 'dhaka', label: 'Dhaka' },
    { value: 'chittagong', label: 'Chittagong' },
    { value: 'rajshahi', label: 'Rajshahi' },
    { value: 'khulna', label: 'Khulna' },
    { value: 'barisal', label: 'Barisal' },
    { value: 'sylhet', label: 'Sylhet' },
    { value: 'rangpur', label: 'Rangpur' },
    { value: 'mymensingh', label: 'Mymensingh' },
];

// ─── Bangladesh Districts by Division ────────────────────────────────────────
export const bangladeshDistricts: Record<string, SelectOption[]> = {
    dhaka: [
        { value: 'dhaka', label: 'Dhaka' },
        { value: 'faridpur', label: 'Faridpur' },
        { value: 'gazipur', label: 'Gazipur' },
        { value: 'gopalganj', label: 'Gopalganj' },
        { value: 'kishoreganj', label: 'Kishoreganj' },
        { value: 'madaripur', label: 'Madaripur' },
        { value: 'manikganj', label: 'Manikganj' },
        { value: 'munshiganj', label: 'Munshiganj' },
        { value: 'narayanganj', label: 'Narayanganj' },
        { value: 'narsingdi', label: 'Narsingdi' },
        { value: 'rajbari', label: 'Rajbari' },
        { value: 'shariatpur', label: 'Shariatpur' },
        { value: 'tangail', label: 'Tangail' },
    ],
    chittagong: [
        { value: 'bandarban', label: 'Bandarban' },
        { value: 'brahmanbaria', label: 'Brahmanbaria' },
        { value: 'chandpur', label: 'Chandpur' },
        { value: 'chittagong', label: 'Chittagong' },
        { value: 'comilla', label: 'Comilla' },
        { value: "cox's_bazar", label: "Cox's Bazar" },
        { value: 'feni', label: 'Feni' },
        { value: 'khagrachhari', label: 'Khagrachhari' },
        { value: 'lakshmipur', label: 'Lakshmipur' },
        { value: 'noakhali', label: 'Noakhali' },
        { value: 'rangamati', label: 'Rangamati' },
    ],
    rajshahi: [
        { value: 'bogra', label: 'Bogra' },
        { value: 'chapai_nawabganj', label: 'Chapai Nawabganj' },
        { value: 'joypurhat', label: 'Joypurhat' },
        { value: 'naogaon', label: 'Naogaon' },
        { value: 'natore', label: 'Natore' },
        { value: 'pabna', label: 'Pabna' },
        { value: 'rajshahi', label: 'Rajshahi' },
        { value: 'sirajganj', label: 'Sirajganj' },
    ],
    khulna: [
        { value: 'bagerhat', label: 'Bagerhat' },
        { value: 'chuadanga', label: 'Chuadanga' },
        { value: 'jessore', label: 'Jessore' },
        { value: 'jhenaidah', label: 'Jhenaidah' },
        { value: 'khulna', label: 'Khulna' },
        { value: 'kushtia', label: 'Kushtia' },
        { value: 'magura', label: 'Magura' },
        { value: 'meherpur', label: 'Meherpur' },
        { value: 'narail', label: 'Narail' },
        { value: 'satkhira', label: 'Satkhira' },
    ],
    barisal: [
        { value: 'barguna', label: 'Barguna' },
        { value: 'barisal', label: 'Barisal' },
        { value: 'bhola', label: 'Bhola' },
        { value: 'jhalokati', label: 'Jhalokati' },
        { value: 'patuakhali', label: 'Patuakhali' },
        { value: 'pirojpur', label: 'Pirojpur' },
    ],
    sylhet: [
        { value: 'habiganj', label: 'Habiganj' },
        { value: 'moulvibazar', label: 'Moulvibazar' },
        { value: 'sunamganj', label: 'Sunamganj' },
        { value: 'sylhet', label: 'Sylhet' },
    ],
    rangpur: [
        { value: 'dinajpur', label: 'Dinajpur' },
        { value: 'gaibandha', label: 'Gaibandha' },
        { value: 'kurigram', label: 'Kurigram' },
        { value: 'lalmonirhat', label: 'Lalmonirhat' },
        { value: 'nilphamari', label: 'Nilphamari' },
        { value: 'panchagarh', label: 'Panchagarh' },
        { value: 'rangpur', label: 'Rangpur' },
        { value: 'thakurgaon', label: 'Thakurgaon' },
    ],
    mymensingh: [
        { value: 'jamalpur', label: 'Jamalpur' },
        { value: 'mymensingh', label: 'Mymensingh' },
        { value: 'netrokona', label: 'Netrokona' },
        { value: 'sherpur', label: 'Sherpur' },
    ],
};

// ─── Residing Status ──────────────────────────────────────────────────────────
export const residingStatusOptions: SelectOption[] = [
    { value: 'citizen', label: 'Citizen' },
    { value: 'permanent_resident', label: 'Permanent Resident (PR)' },
    { value: 'work_permit', label: 'Work Permit / Visa' },
    { value: 'student_visa', label: 'Student Visa' },
    { value: 'visitor_visa', label: 'Visitor / Tourist Visa' },
    { value: 'refugee', label: 'Refugee / Asylum' },
    { value: 'other', label: 'Other' },
];

// ─── Siblings Count ───────────────────────────────────────────────────────────
export const siblingCountOptions: SelectOption[] = Array.from({ length: 11 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? 'None' : String(i),
}));

// ─── Sibling Position ─────────────────────────────────────────────────────────
export const siblingPositionOptions: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}${['st','nd','rd'][i] ?? 'th'}`,
}));

// ─── Family Type ─────────────────────────────────────────────────────────────
export const familyTypeOptions: SelectOption[] = [
    { value: 'nuclear', label: 'Nuclear' },
    { value: 'joint', label: 'Joint' },
    { value: 'extended', label: 'Extended' },
];

// ─── Family Status ────────────────────────────────────────────────────────────
export const familyStatusOptions: SelectOption[] = [
    { value: 'middle_class', label: 'Middle Class' },
    { value: 'upper_middle_class', label: 'Upper Middle Class' },
    { value: 'rich', label: 'Rich / Well Off' },
    { value: 'affluent', label: 'Affluent / Very Rich' },
];

// ─── Rashi (Zodiac / Moon Sign) ───────────────────────────────────────────────
export const rashiOptions: SelectOption[] = [
    { value: 'aries', label: 'Aries (Mesh)' },
    { value: 'taurus', label: 'Taurus (Vrishabha)' },
    { value: 'gemini', label: 'Gemini (Mithun)' },
    { value: 'cancer', label: 'Cancer (Karka)' },
    { value: 'leo', label: 'Leo (Simha)' },
    { value: 'virgo', label: 'Virgo (Kanya)' },
    { value: 'libra', label: 'Libra (Tula)' },
    { value: 'scorpio', label: 'Scorpio (Vrishchik)' },
    { value: 'sagittarius', label: 'Sagittarius (Dhanu)' },
    { value: 'capricorn', label: 'Capricorn (Makar)' },
    { value: 'aquarius', label: 'Aquarius (Kumbha)' },
    { value: 'pisces', label: 'Pisces (Meen)' },
];

// ─── Manglik Status (multi-select for preferences) ────────────────────────────
export const manglikStatusOptions: SelectOption[] = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'partial', label: 'Partial' },
    { value: 'dont_know', label: "Don't Know" },
];

// ─── Working Status ───────────────────────────────────────────────────────────
export const workingStatusOptions: SelectOption[] = [
    { value: 'working', label: 'Working / Employed' },
    { value: 'homemaker', label: 'Homemaker' },
    { value: 'student', label: 'Student' },
    { value: 'not_working', label: 'Not Working' },
];

// ─── Have Children (with "Any" for preferences) ───────────────────────────────
export const prefHasChildrenOptions: SelectOption[] = [
    { value: 'no', label: 'No Children' },
    { value: 'yes', label: 'Has Children' },
    { value: 'any', label: 'Any / Does Not Matter' },
];

// ─── Utility: value → SelectOption ───────────────────────────────────────────
export function toOption(options: SelectOption[], value: string | null | undefined): SelectOption | null {
    if (!value) return null;
    return options.find(o => o.value === value) ?? { value, label: value };
}

export function toOptions(options: SelectOption[], values: string[] | null | undefined): SelectOption[] {
    if (!values) return [];
    return values.map(v => options.find(o => o.value === v) ?? { value: v, label: v });
}

