import { ToasterPlacement } from '@coreui/angular';

export interface IResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface IToast {
  title?: string | null;
  delay?: number;
  placement?: ToasterPlacement;
  color?: string;
  autohide?: boolean;
  message: string;
}

export interface IToastPayload {
  open: boolean;
  options: IToast;
}
