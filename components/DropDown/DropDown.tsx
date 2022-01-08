import React from 'react';
import Menu, {MenuProps} from '@mui/material/Menu';

type DropDownProps = {
  menu: React.ReactElement<MenuProps, typeof Menu>
}

const DropDown: React.FC<DropDownProps> = ({children, menu}) => {
  const anchorElRef = React.useRef(null);
  if (React.Children.only(children) && React.isValidElement(children)) {
    return <>
      {React.cloneElement(children, {ref: anchorElRef})}
      {React.cloneElement(menu, {anchorEl: anchorElRef.current})}
    </>
  }
  return null;
}

export default DropDown;