import { useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '../supabase'; // 确保路径正确

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState<'password' | 'link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendLoginLink = async () => {
    if (!supabase) {
      setMessage('登录服务未配置。请联系管理员。');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage('请先输入邮箱地址。');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setLinkSent(true);
      setMessage('登录链接已发送到你的邮箱，请点击邮件中的链接完成登录。');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : '登录链接发送失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

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
        if (loginMethod === 'link') {
          if (!linkSent) await sendLoginLink();
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;

        if (data.user && data.session) {
          const username = email.trim().toLowerCase().split('@')[0] || `member-${data.user.id.slice(0, 8)}`;
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
          {isLogin && (
            <div role="tablist" aria-label="登录方式" className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                role="tab"
                aria-selected={loginMethod === 'password'}
                onClick={() => {
                  setLoginMethod('password');
                  setLinkSent(false);
                  setMessage('');
                }}
                className={`rounded-lg px-3 py-2 text-sm transition ${loginMethod === 'password' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
              >
                密码登录
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={loginMethod === 'link'}
                onClick={() => {
                  setLoginMethod('link');
                  setLinkSent(false);
                  setMessage('');
                }}
                className={`rounded-lg px-3 py-2 text-sm transition ${loginMethod === 'link' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
              >
                邮箱链接
              </button>
            </div>
          )}
          <div>
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLinkSent(false);
                setMessage('');
              }}
              required
              disabled={loading || linkSent}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all text-sm"
            />
          </div>
          {(!isLogin || loginMethod === 'password') && (
            <div>
              <input
                type="password"
                placeholder="密码 (至少6位)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all text-sm"
              />
            </div>
          )}
          {isLogin && loginMethod === 'link' && linkSent && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setLinkSent(false);
                    setMessage('');
                  }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  更换邮箱
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void sendLoginLink()}
                  className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
                >
                  重新发送链接
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !supabase || (isLogin && loginMethod === 'link' && linkSent)}
            className="w-full py-3 bg-gray-800 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? '处理中...'
              : isLogin && loginMethod === 'link'
                ? linkSent ? '已发送登录链接' : '发送登录链接'
                : isLogin ? '登录' : '注册'}
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
            onClick={() => {
              setIsLogin(!isLogin);
              setLoginMethod('password');
              setLinkSent(false);
              setMessage('');
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
