export interface DialogActions {
  onClick: (arg: any) => any;
  btnColor: string;
  label: string;
}

export interface DialogConfig {
  title: string;
  description: string;
  icon?: string;
  actions: DialogActions[];
}
