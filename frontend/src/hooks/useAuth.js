import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const logout = () => dispatch(logoutAction());
  return { user, isAuthenticated, logout };
};
