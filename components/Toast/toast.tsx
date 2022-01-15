import { useState } from 'react';
import ReactDOM from 'react-dom'
import Toast, { ToastProps } from './ToastComponent';

type ToastWrapperProps = {
  message: string;
  options?: Omit<ToastProps, 'message'>;
  onClosed: () => void;
}

const ToastWrapper: React.FC<ToastWrapperProps> = ({ message, options, onClosed }) => {
  const [open, setOpen] = useState(true);

  return <Toast message={message} snackbarProps={{ open, onClose: (...args) => { setOpen(false); options?.snackbarProps?.onClose?.(...args); }, TransitionProps: { onExited: () => { onClosed() } }, ...options?.snackbarProps }} alertProps={options?.alertProps} ></Toast>
}

const toast = (message: ToastWrapperProps['message'], options?: ToastWrapperProps['options']) => {
  const div = document.createElement('div');
  document.body.appendChild(div);

  ReactDOM.render(<ToastWrapper message={message} options={options} onClosed={() => { document.body.removeChild(div) }}></ToastWrapper>, div)
}

export default toast;