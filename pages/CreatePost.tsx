import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { User } from '../types';
import PostComposer from '../components/PostComposer';

interface CreatePostProps {
  user: User;
}

const CreatePost: React.FC<CreatePostProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-brand-blue font-bold mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </button>
      <PostComposer user={user} standalone onPublished={(id) => navigate(`/post/${id}`)} />
    </div>
  );
};

export default CreatePost;