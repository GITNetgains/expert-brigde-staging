import { FileItem } from "ng2-file-upload";
import { IResponse } from "./util.interface";

export interface IUploaderOptions {
  id?: string;
  url: string;
  multiple?: boolean;
  method?: string;
  autoUpload?: boolean;
  customFields?: { [key: string]: any };
  fileFieldName?: string;
  onProgressItem?: (fileItem: any, progress: number) => void;
  onProgressAll?: (progress: number) => void;
  onCompleteItem?: (onCompleteItem: FileItem, response: IResponse<any>) => void;
  allowedMimeType?: string;
  allowedFileType?: string;
  hintText?: string;
  maxFileSize?: number;
  uploadZone?: boolean;
}