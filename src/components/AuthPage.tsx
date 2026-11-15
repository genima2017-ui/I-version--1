import { useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '../supabase'; // 确保路径正确

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) {
      setMessage('登录服务未配置。请在部署环境中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user && data.session) {
          const username = email.trim().split('@')[0] || `member-${data.user.id.slice(0, 8)}`;
          const { error: profileError } = await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              username,
              full_name: username,
              bio: '',
              avatar_url: null,
            },
            { onConflict: 'id' },
          );
          if (profileError) throw profileError;
          setMessage('注册成功，个人资料已创建。');
        } else {
          setMessage('注册成功！请先验证邮箱，首次登录时会自动创建个人资料。');
        }
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : '发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-8 flex justify-center text-gray-700">
          <Sparkles
            aria-label="Sparkles"
            role="img"
            className="auth-smile-float h-10 w-10"
            strokeWidth={1.5}
          />
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all text-sm"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="密码 (至少6位)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !supabase}
            className="w-full py-3 bg-gray-800 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            {message}
          </p>
        )}

        {!supabase && !message && (
          <p role="alert" className="mt-4 text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            登录服务未配置，请联系管理员。
          </p>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
