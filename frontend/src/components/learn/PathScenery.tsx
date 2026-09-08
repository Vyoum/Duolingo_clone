/** Decorative vector scenery; never changes the learner's path state. */
export function PathScenery({ tennis = false }: { tennis?: boolean }) {
  return <svg className={`path-scenery ${tennis ? "tennis" : "camp"}`} viewBox="0 0 180 210" aria-hidden="true">
    <ellipse cx="80" cy="183" rx="47" ry="22" fill="#3d484b" />
    <path d="M63 151l-6 33m36-33 5 32" stroke="#f95060" strokeWidth="16" strokeLinecap="round" />
    <path d="M57 108h42l13 47q-24 18-58-1Z" fill="#17b5ec" />
    <path d="M70 108v42m18-42v43" stroke="#068fc7" strokeWidth="3" />
    <path d="M54 118l-8 31m54-29 25 14" stroke="#a8673e" strokeWidth="12" strokeLinecap="round" />
    <path d="M58 96h36l7 18-43 2Z" fill="#ffbd29" />
    <rect x="65" y="81" width="24" height="29" rx="10" fill="#a8673e" />
    <path d="M43 46q5-31 40-24 39 2 36 40l-5 20q-9 28-37 23-34-5-34-39Z" fill="#ad7148" />
    <path d="M44 57q33 17 73-3l-2-20-69 1Z" fill="#ffbf2e" />
    <path d="M43 52Q14 33 39 12q10-22 40-11 36-8 43 19 21 26-6 35L87 40 62 60Z" fill="#3f4141" />
    <path d="M91 43l17-13m-17 13 22 3" stroke="#ffbf2e" strokeWidth="6" strokeLinecap="round" />
    <ellipse cx="86" cy="74" rx="8" ry="11" fill="white" /><ellipse cx="106" cy="70" rx="7" ry="10" fill="white" />
    <ellipse cx="89" cy="76" rx="4" ry="7" fill="#563e33" /><ellipse cx="108" cy="72" rx="3.5" ry="7" fill="#563e33" />
    <path d="M87 90q8 5 14-3" fill="none" stroke="#673f2d" strokeWidth="3" strokeLinecap="round" />
    {tennis ? <g><path d="M121 134l22 27" stroke="#aac854" strokeWidth="7" /><ellipse cx="148" cy="169" rx="21" ry="32" transform="rotate(-38 148 169)" fill="none" stroke="#78b929" strokeWidth="7" /><path d="M130 155l35 26m-36-14 28 21m-18-42 32 27m-30-22-8 26m18-20-7 30m17-21-6 26" stroke="#90a09e" strokeWidth="1.5" /><circle cx="151" cy="90" r="11" fill="#f7e500" /><path d="M141 94q10-11 20-6" stroke="white" fill="none" strokeWidth="2" /></g>
      : <g><path d="M121 134l38-13" stroke="#ad642a" strokeWidth="4" /><rect x="151" y="113" width="17" height="12" rx="4" fill="#f8d7b9" /><path d="M127 191l36 15m-36-1 35-17" stroke="#ac681e" strokeWidth="10" strokeLinecap="round" /><path d="M148 139q-38 41-15 55 40 21 34-33-8 9-11-7Z" fill="#ff9800" /><path d="M147 166q-18 23-1 25 21 0 1-25" fill="#ffd600" /></g>}
  </svg>;
}

export function TreasureChest() {
  return <svg viewBox="0 0 90 90" width="78" height="78" aria-hidden="true"><rect x="8" y="65" width="74" height="21" rx="5" fill="#3d484b" /><path d="M14 31h62v45H14Z" fill="#a45e00" /><path d="M19 40h52v21H19Z" fill="#744600" /><path d="M13 17h64v23H13Z" fill="#ffc800" /><path d="M20 13v63m48-63v63" stroke="#ffe500" strokeWidth="9" /><path d="M12 38h66M15 72h60" stroke="#ffb800" strokeWidth="7" /><rect x="36" y="29" width="19" height="18" rx="3" fill="#ffdb00" /><circle cx="45" cy="36" r="4" fill="#ac6b00" /><path d="M45 36v7" stroke="#ac6b00" strokeWidth="4" /></svg>;
}
