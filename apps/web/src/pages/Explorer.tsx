import { useParams } from 'react-router-dom';

export default function Explorer() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex items-center justify-center h-full text-3xl text-gray-500">
      Explorer for site {id}
    </div>
  );
} 