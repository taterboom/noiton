import { Alert, AlertProps, Snackbar, SnackbarProps } from "@mui/material";

export type ToastProps = {
  message: string;
  snackbarProps?: SnackbarProps;
  alertProps?: AlertProps;
}

const Toast: React.FC<ToastProps> = ({ snackbarProps, alertProps, message }) => {
  return (
    <Snackbar {...snackbarProps} autoHideDuration={snackbarProps?.autoHideDuration || 3000}>
      <Alert {...alertProps} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export default Toast;