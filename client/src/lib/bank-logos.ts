export type BankLogo = { match: RegExp; logo: string; label: string };

export const BANK_LOGOS: BankLogo[] = [
  {
    match: /aljazira|al jazira|al-jazira|الجزيرة/i,
    logo: "https://upload.wikimedia.org/wikipedia/ar/thumb/4/4d/Aljazira_Bank_Logo.svg/1280px-Aljazira_Bank_Logo.svg.png",
    label: "بنك الجزيرة",
  },
  {
    match: /\bnational commercial\b|\bncb\b|\bsaudi national\b|\bsnb\b|الأهلي|الاهلي/i,
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/NCB.svg/960px-NCB.svg.png",
    label: "البنك الأهلي السعودي",
  },
  {
    match: /rajhi|الراجحي/i,
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRm6UEYNPH2WBsqWWVXZ-3rpEYZLud_mpGdyg&s",
    label: "مصرف الراجحي",
  },
  {
    match: /riyad|الرياض/i,
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Riyad_Bank_logo.svg/3840px-Riyad_Bank_logo.svg.png",
    label: "بنك الرياض",
  },
  {
    match: /sab|saudi british|saudi awwal|الأول|الاول|البريطاني/i,
    logo: "http://upload.wikimedia.org/wikipedia/commons/thumb/5/52/SAB_logo_%28since_2023%29.svg/1280px-SAB_logo_%28since_2023%29.svg.png",
    label: "البنك السعودي الأول",
  },
  {
    match: /albilad|al bilad|al-bilad|البلاد/i,
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Bank_Albilad_logo.svg/1280px-Bank_Albilad_logo.svg.png",
    label: "بنك البلاد",
  },
  {
    match: /alinma|al inma|al-inma|الإنماء|الانماء/i,
    logo: "https://upload.wikimedia.org/wikipedia/en/1/19/Alinma_Bank_Logo.svg",
    label: "مصرف الإنماء",
  },
];

export function findBankLogo(bankName?: string | null): BankLogo | null {
  if (!bankName) return null;
  return BANK_LOGOS.find((b) => b.match.test(bankName)) || null;
}
