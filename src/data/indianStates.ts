export type IndianRegionType = 'STATE' | 'UNION_TERRITORY';

export interface IndianRegion {
  name: string;
  type: IndianRegionType;
}

export const INDIAN_STATES_AND_UTS: IndianRegion[] = [
  { name: 'Andhra Pradesh', type: 'STATE' },
  { name: 'Arunachal Pradesh', type: 'STATE' },
  { name: 'Assam', type: 'STATE' },
  { name: 'Bihar', type: 'STATE' },
  { name: 'Chhattisgarh', type: 'STATE' },
  { name: 'Goa', type: 'STATE' },
  { name: 'Gujarat', type: 'STATE' },
  { name: 'Haryana', type: 'STATE' },
  { name: 'Himachal Pradesh', type: 'STATE' },
  { name: 'Jharkhand', type: 'STATE' },
  { name: 'Karnataka', type: 'STATE' },
  { name: 'Kerala', type: 'STATE' },
  { name: 'Madhya Pradesh', type: 'STATE' },
  { name: 'Maharashtra', type: 'STATE' },
  { name: 'Manipur', type: 'STATE' },
  { name: 'Meghalaya', type: 'STATE' },
  { name: 'Mizoram', type: 'STATE' },
  { name: 'Nagaland', type: 'STATE' },
  { name: 'Odisha', type: 'STATE' },
  { name: 'Punjab', type: 'STATE' },
  { name: 'Rajasthan', type: 'STATE' },
  { name: 'Sikkim', type: 'STATE' },
  { name: 'Tamil Nadu', type: 'STATE' },
  { name: 'Telangana', type: 'STATE' },
  { name: 'Tripura', type: 'STATE' },
  { name: 'Uttar Pradesh', type: 'STATE' },
  { name: 'Uttarakhand', type: 'STATE' },
  { name: 'West Bengal', type: 'STATE' },
  { name: 'Andaman and Nicobar Islands', type: 'UNION_TERRITORY' },
  { name: 'Chandigarh', type: 'UNION_TERRITORY' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UNION_TERRITORY' },
  { name: 'Delhi', type: 'UNION_TERRITORY' },
  { name: 'Jammu and Kashmir', type: 'UNION_TERRITORY' },
  { name: 'Ladakh', type: 'UNION_TERRITORY' },
  { name: 'Lakshadweep', type: 'UNION_TERRITORY' },
  { name: 'Puducherry', type: 'UNION_TERRITORY' },
];

export const INDIAN_STATES = INDIAN_STATES_AND_UTS.filter(r => r.type === 'STATE');
export const INDIAN_UNION_TERRITORIES = INDIAN_STATES_AND_UTS.filter(r => r.type === 'UNION_TERRITORY');

if (INDIAN_STATES.length !== 28 || INDIAN_UNION_TERRITORIES.length !== 8) {
  throw new Error('CivicAI region configuration must contain exactly 28 States and 8 Union Territories.');
}
