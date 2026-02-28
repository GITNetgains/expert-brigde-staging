export interface IPayoutAccount {
    _id?: string;
    type?: string;
    /** Bank account region: uk, india, us, other */
    bankAccountRegion?: string;
    paypalAccount?: string;
    accountHolderName?: string;
  accountHolderAddress?: string;
  accountHolderPostalCode?: string;
    accountNumber?: string;
  isPersonalAccount?: boolean;
  taxIdNumber?: string;
  uniqueIdentificationNumberType?: string;
    iban?: string;
    bankName?: string;
    bankAddress?: string;
    sortCode?: string;
    routingNumber?: string;
    swiftCode?: string;
    ifscCode?: string;
    routingCode?: string;
    createdAt?: string;
}

export interface IPayoutRequest {
    _id: string;
    createdAt: string;
    total: number;
    commission: number;
    balance: number;
    status: string;
    requestToTime: string;
}
