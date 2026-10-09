import { writeFile } from 'node:fs/promises'
import * as lucide from 'lucide-react'

// Curated rather than importing the full library into the browser. This source
// generates both renderable components and the API's structured-output enum.
const sections = {
  Everyday: 'Check ListChecks Star Target Flag Award Trophy Flame Sparkles CircleCheck Bookmark Smile ThumbsUp Circle Square Triangle Hexagon Infinity CircleDot CircleDashed',
  'Health & fitness': 'Heart Dumbbell Footprints Activity HeartPulse Bike PersonStanding Accessibility StretchHorizontal Move Timer Gauge Weight BicepsFlexed Stethoscope Pill Bandage Hospital Cross ShieldCheck HandHeart HeartHandshake',
  'Mind & rest': 'Sun Moon Leaf Flower Flower2 Brain BrainCircuit Lightbulb Coffee BedDouble Bed AlarmClock Sunrise Sunset CloudMoon CloudSun Wind Waves Sparkle ScanEye Eye Headphones SmilePlus Frown Meh Bath Lamp',
  'Food & drink': 'Droplet Apple Banana Cherry Grape Citrus Carrot Salad Soup Utensils UtensilsCrossed CookingPot ChefHat Egg Fish Drumstick Wheat Croissant Sandwich Pizza CupSoda GlassWater Wine Beer Milk IceCreamBowl Cake Cookie Candy Nut Popcorn IceCreamCone Beef',
  'Learning & work': 'BookOpen Book BookMarked BookOpenCheck Library LibraryBig GraduationCap Notebook NotebookPen Pencil PenTool School Languages Globe Calculator Microscope Telescope Atom FlaskConical TestTube Compass Ruler Monitor Laptop Keyboard Mouse Smartphone Code Braces Terminal Database FileText ClipboardCheck Briefcase BriefcaseBusiness Presentation ChartNoAxesCombined Calendar CalendarCheck CalendarDays Clock Hourglass ListTodo ListOrdered CheckCheck Folder FolderOpen Archive Search MessageSquare MessagesSquare Mail Phone Handshake Wallet Banknote Coins Landmark Receipt PiggyBank CreditCard',
  'Home & family': 'House DoorOpen KeyRound Sofa Armchair LampDesk Trash2 Brush Paintbrush SprayCan WashingMachine Refrigerator Microwave CookingPot Baby Users UserRound Contact Hand HelpingHand ShoppingBag ShoppingBasket ShoppingCart Package PackageCheck Boxes Broom',
  'Nature & travel': 'TreePine Trees Sprout Clover Mountain MountainSnow Tent TentTree Map MapPin Navigation Route Plane TrainFront Bus Car CarFront Ship Sailboat Rocket Luggage Backpack Camera Binoculars SunSnow Umbrella Cloud CloudRain CloudLightning Snowflake PawPrint Dog Cat Bird Rabbit Turtle Bug',
  'Creativity & play': 'Music Music2 Guitar Piano Drum Mic Palette Scissors Clapperboard Film Video Image Gamepad2 Puzzle Dice5 Dice6 Spade Club Diamond Volleyball Radio Tv Ticket PartyPopper Gift Joystick Blocks Origami Shapes PencilRuler',
  Technology: 'BatteryFull BatteryCharging Plug PlugZap Power Wifi Bluetooth Cpu HardDrive Usb Cable CircuitBoard Fingerprint Lock LockOpen Shield Bell BellOff Vibrate SmartphoneNfc Watch Headset Network MousePointer2 QrCode ScanLine',
}

const aliases = { Check: 'check', ListChecks: 'plan', BookOpen: 'book', Book: 'closed-book', Footprints: 'walk', Droplet: 'water' }
const labels = { Check: 'Checkmark', ListChecks: 'Checklist', BookOpen: 'Reading', Book: 'Book', Footprints: 'Walking', Droplet: 'Water', BicepsFlexed: 'Strength', ChartNoAxesCombined: 'Progress chart', CircleDashed: 'Dotted circle', Move: 'Movement', Cpu: 'Processor', QrCode: 'QR code' }
const keywords = {
  Check: 'complete done tick yes', ListChecks: 'tasks plan routine todo', BookOpen: 'read book literature pages reading', Footprints: 'walk steps walking exercise run running',
  Droplet: 'drink water hydrate hydration', Leaf: 'nature outdoors garden plant meditation', Dumbbell: 'gym exercise workout lifting strength',
  Brain: 'mind mindfulness focus meditation mental', BedDouble: 'sleep rest bedtime', AlarmClock: 'wake morning early sleep alarm',
  Languages: 'study learn language spanish french vocabulary', PiggyBank: 'save money savings finances', Broom: 'clean chores house sweeping',
  Heart: 'love care health gratitude', HeartHandshake: 'relationship friends kindness connection', NotebookPen: 'write journal diary notes',
  Sun: 'morning day light sunshine', Moon: 'evening night bedtime', Smartphone: 'phone screen digital detox', HandHeart: 'gratitude kindness care',
}

const seen = new Set()
const catalog = []
for (const [category, names] of Object.entries(sections)) {
  for (const component of names.split(' ')) {
    if (seen.has(component)) continue
    if (!lucide[component]) throw new Error(`Lucide component is unavailable: ${component}`)
    seen.add(component)
    const label = labels[component] || component.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    const id = aliases[component] || component.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    catalog.push({ id, label, category, keywords: keywords[component] || '', component })
  }
}
if (new Set(catalog.map((icon) => icon.id)).size !== catalog.length) throw new Error('Duplicate habit icon IDs')
await writeFile(new URL('../src/data/habitIcons.json', import.meta.url), `${JSON.stringify(catalog, null, 2)}\n`)
await writeFile(new URL('../src/data/habitIconComponents.js', import.meta.url),
  `// Generated by scripts/generate-habit-icons.mjs.\nimport {\n${catalog.map((icon) => `  ${icon.component === 'Infinity' ? 'Infinity as InfinityIcon' : icon.component},`).join('\n')}\n} from 'lucide-react'\n\nexport const HABIT_ICON_COMPONENTS = {\n${catalog.map((icon) => `  '${icon.id}': ${icon.component === 'Infinity' ? 'InfinityIcon' : icon.component},`).join('\n')}\n}\n`)
if (process.argv[2]) await writeFile(process.argv[2], `${JSON.stringify(catalog, null, 2)}\n`)
console.log(`Generated ${catalog.length} habit icons`)
