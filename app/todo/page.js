'use client';
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

function LoginModal({ closeModal }) {
    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="auth-modal" onClick={e => e.stopPropagation()}>
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    theme="dark"
                    providers={[]}
                    localization={{
                        variables: {
                            sign_in: { email_label: '이메일', password_label: '비밀번호', button_label: '로그인', social_provider_text: '{{provider}} 계정으로 로그인' },
                            sign_up: { email_label: '이메일', password_label: '비밀번호', button_label: '회원가입', social_provider_text: '{{provider}} 계정으로 가입' }
                        }
                    }}
                />
            </div>
        </div>
    );
}

function App() {
    const [todos, setTodos] = userState([]);
    const [newWork, setNewWork] = useState('');
    const [currentUser, setCurrentUser] = useState('');
    const [newReuse, setNewReuse] = useState(0);
    const [selectDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReusableTodos, setShowReusableTodos] = useState(false);

    useEffect(() => {
        getTodos();
    }, [setSelectedDate, showReusableTodos]);

    async function getTodos(){
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('todo')
                .select('*')
                .eq('user', currentUser)
                .order('created_at', {ascending: true});

            if(showReusableTodos){
                query = query.eq('reuse', 1);

            }else{
                const startOfDay = `${selectedDate}T00:00:00.000Z`;
                const endOfDay = `${selectDate}T23:59:59.999Z`;
                query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
            }

            const {data, error} = await query;

            if(error){
                throw error;
            }
            setTodos(data);
        } catch(error){
            setError(error.message);
            console.error('Error fetching todes:', error.message);
        }finally{
            setLoading(false);
        }
    }
}