import { useSelector, useDispatch } from 'react-redux';

export const useProjects = () => {
  const dispatch = useDispatch();
  const { list, current, loading, error } = useSelector((state) => state.projects);
  return { projects: list, currentProject: current, loading, error, dispatch };
};
