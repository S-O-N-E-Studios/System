import { useSelector, useDispatch } from 'react-redux';

export const useTasks = () => {
  const dispatch = useDispatch();
  const { list, current, loading, error } = useSelector((state) => state.tasks);
  return { tasks: list, currentTask: current, loading, error, dispatch };
};
