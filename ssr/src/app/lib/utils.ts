import * as CryptoJS from 'crypto-js';
export function randomHash(len: number, charSetInput: string) {
  const charSet =
    charSetInput ||
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < len; i++) {
    const randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
}

export const ageFilter = [
  { from: 1, to: 3 },
  { from: 3, to: 5 },
  { from: 5, to: 9 },
  { from: 9, to: 13 },
  { from: 13, to: 15 },
  { from: 15, to: 19 },
  { from: 19, to: 23 },
  { from: 23, to: 25 },
  { from: 25, to: 30 },
  { from: 30, to: 40 },
  { from: 40, to: 100 }
];

export const getError = (err: any): string => {
  if (err && err.data) {
    return (err.data.data && err.data.data.message) || err.data.message;
  }
  return err.message || 'Something went wrong, please try again';
};

export const quillConfig = {
  toolbar: {
    container: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['code-block'],
      [{ header: 1 }, { header: 2 }], // custom button values
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
      [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
      [{ direction: 'rtl' }], // text direction

      [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],

      [{ font: [] }],
      [{ align: [] }],

      ['clean']
      // ['image']
    ]
  },
  keyboard: {
    bindings: {
      enter: {
        key: 13,
        handler: () => {
          return true;
        }
      }
    }
  }
};

export const encrypt = (object: any, key: string) => {
  const jsonString = JSON.stringify(object);
  return CryptoJS.AES.encrypt(jsonString, key).toString();
};

export const decrypt = (encryptedString: string, key: string) => {
  const bytes = CryptoJS.AES.decrypt(encryptedString, key);
  const jsonString = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(jsonString);
};
